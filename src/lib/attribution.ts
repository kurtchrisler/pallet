import { cookies } from "next/headers";

const COOKIE_NAME = "ft_attribution";

export type Attribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer_host: string | null;
};

const EMPTY: Attribution = { utm_source: null, utm_medium: null, utm_campaign: null, referrer_host: null };

/** Reads the first-touch attribution cookie AttributionCapture.tsx sets on
 * the visitor's first page load. Best-effort — a missing or malformed
 * cookie just means "no attribution data," never a thrown error. */
export async function readAttributionCookie(): Promise<Attribution> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(COOKIE_NAME)?.value;
    if (!raw) return EMPTY;
    const parsed = JSON.parse(decodeURIComponent(raw));
    return {
      utm_source: typeof parsed.utm_source === "string" ? parsed.utm_source : null,
      utm_medium: typeof parsed.utm_medium === "string" ? parsed.utm_medium : null,
      utm_campaign: typeof parsed.utm_campaign === "string" ? parsed.utm_campaign : null,
      referrer_host: typeof parsed.referrer_host === "string" ? parsed.referrer_host : null,
    };
  } catch {
    return EMPTY;
  }
}
