"use client";

import { useEffect } from "react";

const COOKIE_NAME = "ft_attribution";
const COOKIE_DAYS = 30;

/**
 * Records first-touch marketing attribution (utm_source/medium/campaign,
 * plus the referring site if there's no UTM tag at all) the moment someone
 * first lands on the site, so it can travel with them to /signup even if
 * that's a different page visit. Only ever writes the cookie once — a
 * later visit with different (or no) params doesn't overwrite the
 * original source, since the whole point is "where did this customer
 * originally come from."
 *
 * Best-effort only: if cookies are blocked or anything here throws, the
 * page just renders normally with no attribution recorded.
 */
export function AttributionCapture() {
  useEffect(() => {
    try {
      const alreadyCaptured = document.cookie.split("; ").some((c) => c.startsWith(COOKIE_NAME + "="));
      if (alreadyCaptured) return;

      const params = new URLSearchParams(window.location.search);
      const utmSource = params.get("utm_source");
      const utmMedium = params.get("utm_medium");
      const utmCampaign = params.get("utm_campaign");

      let referrerHost: string | null = null;
      if (document.referrer) {
        try {
          const refUrl = new URL(document.referrer);
          if (refUrl.hostname && refUrl.hostname !== window.location.hostname) {
            referrerHost = refUrl.hostname;
          }
        } catch {
          // malformed/opaque referrer — ignore
        }
      }

      // Nothing worth recording (a plain direct visit) — leave no cookie,
      // so a later visit that *does* carry a UTM tag can still be captured.
      if (!utmSource && !utmMedium && !utmCampaign && !referrerHost) return;

      const value = encodeURIComponent(
        JSON.stringify({ utm_source: utmSource, utm_medium: utmMedium, utm_campaign: utmCampaign, referrer_host: referrerHost })
      );
      const expires = new Date(Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `${COOKIE_NAME}=${value}; expires=${expires}; path=/; SameSite=Lax`;
    } catch {
      // best-effort only — never let attribution tracking break the page
    }
  }, []);

  return null;
}
