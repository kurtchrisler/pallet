import Link from "next/link";
import Image from "next/image";
import { submitContactForm } from "@/app/contact/actions";
import { SUPPORT_EMAIL } from "@/lib/types";

export const metadata = {
  title: "Contact — FlipTrackr",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <div className="min-h-screen bg-paper">
      <header className="max-w-[1080px] mx-auto px-4 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="FlipTrackr" width={32} height={32} className="w-8 h-8 rounded-lg" priority />
          <span className="font-display font-semibold text-lg tracking-tight">FlipTrackr</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/pricing" className="text-ink-soft hover:text-ink hidden sm:inline">
            Pricing
          </Link>
          <Link href="/login" className="text-ink-soft hover:text-ink">
            Log in
          </Link>
        </nav>
      </header>

      <section className="max-w-[560px] mx-auto px-4 pt-8 pb-20">
        <h1 className="text-3xl font-display font-semibold tracking-tight mb-2">Contact us</h1>
        <p className="text-sm text-ink-soft mb-8">
          Questions, bug reports, or anything else — send us a message and we&apos;ll get back to you at the email
          you provide. You can also reach us directly at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent hover:underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>

        <div className="bg-surface border border-line rounded-xl shadow-sm p-6">
          {success && (
            <div className="mb-4 text-sm bg-good-soft text-good rounded-lg px-3 py-2">
              Thanks — your message is on its way. We&apos;ll reply as soon as we can.
            </div>
          )}
          {error && <div className="mb-4 text-sm bg-alert-soft text-alert rounded-lg px-3 py-2">{error}</div>}

          <form action={submitContactForm} className="flex flex-col gap-3">
            {/* Honeypot — left blank by real visitors, invisible and
                unreachable by keyboard, so anything here means a bot. */}
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] w-px h-px opacity-0"
            />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
              <span>Name (optional)</span>
              <input name="name" autoComplete="name" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
              <span>Email</span>
              <input type="email" name="email" required autoComplete="email" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
              <span>Message</span>
              <textarea name="message" required rows={5} className="resize-y" />
            </label>
            <button
              type="submit"
              className="mt-2 bg-accent text-accent-ink font-semibold rounded-lg px-4 py-2.5 text-sm shadow-sm hover:brightness-[1.08]"
            >
              Send message
            </button>
          </form>
        </div>
      </section>

      <footer className="max-w-[1080px] mx-auto px-4 py-8 border-t border-line text-sm text-ink-faint flex flex-wrap gap-4 justify-between">
        <span>© {new Date().getFullYear()} FlipTrackr</span>
        <div className="flex gap-4">
          <Link href="/pricing" className="hover:text-ink-soft">
            Pricing
          </Link>
          <Link href="/privacy" className="hover:text-ink-soft">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-ink-soft">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
