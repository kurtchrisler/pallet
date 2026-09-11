import { createAdminClient } from "@/lib/supabase/admin";

const TOKEN_ENDPOINT = "https://auth.aweber.com/oauth2/token";
const API_BASE = "https://api.aweber.com/1.0";
const SETTINGS_KEY = "aweber_oauth";

type StoredTokens = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch ms
};

/** AWeber's OAuth2 access tokens last about an hour, and a refresh may hand
 * back a brand new refresh token rather than reusing the old one — so the
 * live tokens live in the database (app_settings), not just an env var.
 * AWEBER_REFRESH_TOKEN is only the one-time seed from the initial
 * out-of-band authorization; after the first refresh, the database row is
 * the source of truth. */

async function loadStoredTokens(): Promise<StoredTokens | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("app_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle();
  return (data?.value as StoredTokens | undefined) ?? null;
}

async function saveTokens(tokens: StoredTokens) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("app_settings")
    .upsert({ key: SETTINGS_KEY, value: tokens, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) console.error("Failed to persist AWeber tokens", error);
}

function basicAuthHeader() {
  const id = process.env.AWEBER_CLIENT_ID;
  const secret = process.env.AWEBER_CLIENT_SECRET;
  if (!id || !secret) throw new Error("AWEBER_CLIENT_ID / AWEBER_CLIENT_SECRET are not set");
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

async function refreshTokens(refreshToken: string): Promise<StoredTokens> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });

  if (!res.ok) {
    throw new Error(`AWeber token refresh failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as { access_token: string; refresh_token?: string; expires_in?: number };
  const tokens: StoredTokens = {
    access_token: json.access_token,
    // Always persist whatever comes back — falls back to the token we sent
    // only if AWeber's response happens to omit a new one.
    refresh_token: json.refresh_token || refreshToken,
    expires_at: Date.now() + (Number(json.expires_in || 3600) - 60) * 1000, // 60s safety buffer
  };
  await saveTokens(tokens);
  return tokens;
}

async function getAccessToken(): Promise<string> {
  const stored = await loadStoredTokens();
  if (stored && stored.expires_at > Date.now()) {
    return stored.access_token;
  }

  const refreshToken = stored?.refresh_token || process.env.AWEBER_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error("No AWeber refresh token available — set AWEBER_REFRESH_TOKEN to seed it.");
  }
  const fresh = await refreshTokens(refreshToken);
  return fresh.access_token;
}

/** Adds someone to the configured AWeber list. Deliberately never throws —
 * a mailing-list signup failing should never take down the checkout flow
 * or Stripe webhook it's called from. Failures are just logged. */
export async function addAWeberSubscriber(email: string, name?: string | null) {
  const accountId = process.env.AWEBER_ACCOUNT_ID;
  const listId = process.env.AWEBER_LIST_ID;
  if (!accountId || !listId) {
    console.error("AWeber not configured: AWEBER_ACCOUNT_ID / AWEBER_LIST_ID missing");
    return;
  }

  try {
    const accessToken = await getAccessToken();
    const res = await fetch(`${API_BASE}/accounts/${accountId}/lists/${listId}/subscribers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${accessToken}`,
      },
      body: new URLSearchParams({
        email,
        ...(name ? { name } : {}),
      }),
    });

    if (res.ok) return;

    const text = await res.text();
    // Someone already on the list isn't a failure worth logging.
    if (res.status === 400 && /already subscri|already exists/i.test(text)) return;

    console.error("AWeber addSubscriber failed", res.status, text);
  } catch (err) {
    console.error("AWeber addSubscriber threw", err);
  }
}
