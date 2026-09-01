"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const businessName = String(formData.get("businessName") || "").trim();

  if (!email || !password) {
    redirect("/signup?error=" + encodeURIComponent("Enter an email and password."));
  }
  if (password.length < 8) {
    redirect("/signup?error=" + encodeURIComponent("Password must be at least 8 characters."));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/dashboard`,
      data: { business_name: businessName },
    },
  });

  if (error) {
    redirect("/signup?error=" + encodeURIComponent(error.message));
  }

  // If email confirmation is off in the Supabase project, a session comes
  // back immediately; otherwise the user needs to click the emailed link.
  if (data.session) {
    redirect("/dashboard");
  }
  redirect("/login?message=" + encodeURIComponent("Check your email to confirm your account."));
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/dashboard");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }
  redirect(next || "/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
  });
  // Always show the same message whether or not the email exists, so the
  // form can't be used to check which emails have accounts.
  redirect("/login?message=" + encodeURIComponent("If that email has an account, a reset link is on its way."));
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (password.length < 8) {
    redirect("/reset-password?error=" + encodeURIComponent("Password must be at least 8 characters."));
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect("/reset-password?error=" + encodeURIComponent(error.message));
  }
  redirect("/dashboard");
}
