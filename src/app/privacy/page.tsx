import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Privacy Policy — FlipTrackr",
};

export default function PrivacyPage() {
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

      <section className="max-w-[720px] mx-auto px-4 pt-8 pb-20">
        <h1 className="text-3xl font-display font-semibold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-ink-faint mb-10">Last updated: September 15, 2026</p>

        <div className="flex flex-col gap-8 text-sm leading-relaxed text-ink-soft">
          <p>
            This Privacy Policy describes how FlipTrackr (&quot;FlipTrackr,&quot; &quot;we,&quot; &quot;us,&quot;
            or &quot;our&quot;) collects, uses, and protects information when you use our website and application
            (the &quot;Service&quot;). By using the Service, you agree to the collection and use of information in
            accordance with this policy.
          </p>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">Information we collect</h2>
            <p className="mb-3">
              <strong className="text-ink">Account information.</strong> When you create an account, we collect
              your email address and password (stored securely and encrypted by our authentication provider — we
              never see or store your password in plain text). If you provide a business name, we store that too.
            </p>
            <p className="mb-3">
              <strong className="text-ink">Business data you enter.</strong> The core of FlipTrackr is tracking
              your own inventory and sales. Anything you enter — pallets, items, costs, sales, expenses, and
              related notes — is stored so the app can calculate your numbers and show them back to you. This data
              belongs to you and is private to your account; we do not access it except as needed to provide
              support or maintain the Service.
            </p>
            <p className="mb-3">
              <strong className="text-ink">Payment information.</strong> Subscription payments are processed by
              Stripe. We never see or store your full card number — Stripe handles that directly and shares with
              us only what&apos;s needed to manage your subscription (such as your subscription status and billing
              dates).
            </p>
            <p>
              <strong className="text-ink">Automatically collected information.</strong> Like most web
              applications, our hosting and authentication providers automatically log standard technical
              information (such as IP address and browser type) for security and reliability purposes, and use a
              small number of essential cookies to keep you signed in. We do not use third-party advertising or
              analytics trackers.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">How we use your information</h2>
            <p className="mb-2">We use the information we collect to:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>Provide, maintain, and operate the Service</li>
              <li>Process your subscription payments and manage billing</li>
              <li>Send account-related emails, such as confirming your email address or resetting your password</li>
              <li>Respond to support requests</li>
              <li>Detect, prevent, and address technical issues, abuse, or security incidents</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">Marketing emails</h2>
            <p>
              If you become a paying subscriber, we add your email address to our mailing list so we can send
              product updates and occasional marketing emails. Every email includes an unsubscribe link, and
              unsubscribing does not affect your FlipTrackr account or subscription in any way.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">Third-party service providers</h2>
            <p className="mb-2">
              We rely on a small number of trusted providers to run the Service, each of which processes limited
              data on our behalf under their own privacy and security practices:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li><strong className="text-ink">Supabase</strong> — database hosting and account authentication</li>
              <li><strong className="text-ink">Stripe</strong> — subscription billing and payment processing</li>
              <li><strong className="text-ink">Vercel</strong> — application hosting</li>
              <li><strong className="text-ink">Resend</strong> — delivery of account emails (confirmations, password resets)</li>
              <li><strong className="text-ink">AWeber</strong> — our mailing list, for subscribers as described above</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal information to anyone, and we do not share your business data (pallets,
              items, sales, expenses) with any third party except as required to operate the Service or comply
              with the law.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">Data security</h2>
            <p>
              Your data is protected by database-level access rules that keep each account&apos;s information
              private, even from other FlipTrackr customers. No method of transmission or storage is 100% secure,
              but we take reasonable, industry-standard measures to protect your information.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">Data retention and your rights</h2>
            <p className="mb-3">
              We retain your account and business data for as long as your account is active. You can export your
              items and sales data as CSV files at any time from within the app. If you&apos;d like your account
              and data deleted, or would like a copy of the personal information we hold about you, contact us at
              the email below and we&apos;ll take care of it.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">Children&apos;s privacy</h2>
            <p>
              The Service is intended for business use by adults and is not directed at children under 16. We do
              not knowingly collect personal information from children.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we&apos;ll update
              the &quot;Last updated&quot; date above.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">Contact us</h2>
            <p>
              If you have any questions about this Privacy Policy, contact us at{" "}
              <a href="mailto:support@fliptrackr.app" className="text-accent hover:underline">
                support@fliptrackr.app
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <footer className="max-w-[1080px] mx-auto px-4 py-8 border-t border-line text-sm text-ink-faint flex flex-wrap gap-4 justify-between">
        <span>© {new Date().getFullYear()} FlipTrackr</span>
        <div className="flex gap-4">
          <Link href="/pricing" className="hover:text-ink-soft">
            Pricing
          </Link>
          <Link href="/terms" className="hover:text-ink-soft">
            Terms of Service
          </Link>
          <Link href="/contact" className="hover:text-ink-soft">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}
