"use server";

import { redirect } from "next/navigation";
import { SUPPORT_EMAIL } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sends a contact-form message to support@fliptrackr.app via Resend's API
 * (the same Resend account already used for account emails — just its
 * plain HTTP API this time, not the SMTP relay Supabase uses). Requires
 * RESEND_API_KEY to be set; see .env.example.
 */
export async function submitContactForm(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim();
  // Honeypot: a real visitor never sees or fills this field (hidden via
  // CSS on the page), so anything in it means a bot filled out every
  // input it found. Pretend success without actually sending anything.
  const honeypot = String(formData.get("company") || "").trim();

  if (honeypot) {
    redirect("/contact?success=1");
  }

  if (!email || !EMAIL_RE.test(email)) {
    redirect("/contact?error=" + encodeURIComponent("Enter a valid email address."));
  }
  if (!message) {
    redirect("/contact?error=" + encodeURIComponent("Enter a message."));
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("submitContactForm: RESEND_API_KEY is not set");
    redirect("/contact?error=" + encodeURIComponent("Sorry, the contact form isn't set up yet. Please email us directly."));
  }

  // Note: no redirect() calls inside this try block — see the same note
  // in signup/actions.ts for why that would misfire the catch below.
  let failureMessage: string | null = null;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `FlipTrackr Contact Form <contact@fliptrackr.app>`,
        to: [SUPPORT_EMAIL],
        reply_to: email,
        subject: `New contact form message${name ? ` from ${name}` : ""}`,
        text: `From: ${name || "(no name given)"} <${email}>\n\n${message}`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("submitContactForm: Resend API error", res.status, body);
      failureMessage = "Something went wrong sending your message. Please try again.";
    }
  } catch (err) {
    console.error("submitContactForm: failed to send", err);
    failureMessage = "Something went wrong sending your message. Please try again.";
  }

  if (failureMessage) {
    redirect("/contact?error=" + encodeURIComponent(failureMessage));
  }
  redirect("/contact?success=1");
}
