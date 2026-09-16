import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Terms of Service — FlipTrackr",
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-display font-semibold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-ink-faint mb-10">Last updated: September 15, 2026</p>

        <div className="flex flex-col gap-8 text-sm leading-relaxed text-ink-soft">
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of FlipTrackr (the
            &quot;Service&quot;), operated by FlipTrackr (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By
            creating an account or using the Service, you agree to be bound by these Terms. If you don&apos;t
            agree, please don&apos;t use the Service.
          </p>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">1. The Service</h2>
            <p>
              FlipTrackr is a subscription tool for tracking inventory costs, sales, and profit — designed for
              resellers who buy in bulk (pallets, case packs, and similar bulk lots). You are responsible for the
              accuracy of the data you enter; FlipTrackr provides calculations and reporting based on that data,
              but does not verify it.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">2. Accounts</h2>
            <p>
              You must provide accurate information when creating an account and keep your login credentials
              secure. You&apos;re responsible for all activity that happens under your account. Let us know right
              away if you suspect unauthorized access.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">3. Subscription and billing</h2>
            <p className="mb-3">
              FlipTrackr is billed as a recurring monthly subscription through Stripe. By subscribing, you
              authorize us to charge your payment method on a recurring basis until you cancel.
            </p>
            <p>
              You can cancel anytime from the Billing page in your account, which takes you to Stripe&apos;s
              secure customer portal. Cancellation stops future billing; we do not provide refunds for partial
              billing periods unless required by law.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">4. Your data</h2>
            <p>
              You own the business data you enter into FlipTrackr (pallets, items, sales, expenses, and related
              content). We store and process it solely to provide the Service to you, as described in our{" "}
              <Link href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>
              . You can export your data as CSV at any time, and you may request deletion of your account and data
              by contacting us.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">5. Acceptable use</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to access another user&apos;s account or data without authorization</li>
              <li>Interfere with or disrupt the Service&apos;s infrastructure or security</li>
              <li>Reverse engineer or resell the Service without our written permission</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">6. Intellectual property</h2>
            <p>
              The Service, including its design, code, and branding, is owned by FlipTrackr and protected by
              applicable intellectual property laws. These Terms don&apos;t grant you any rights to our trademarks
              or branding.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">7. Disclaimer of warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any
              kind, express or implied. We don&apos;t guarantee the Service will be uninterrupted, error-free, or
              that the calculations it produces will be free from errors — you&apos;re responsible for verifying
              figures that matter for tax or accounting purposes.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">8. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, FlipTrackr will not be liable for any indirect, incidental,
              special, or consequential damages arising from your use of the Service, including lost profits or
              lost data. Our total liability for any claim relating to the Service will not exceed the amount you
              paid us in the twelve months before the claim arose.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">9. Termination</h2>
            <p>
              You may stop using the Service and cancel your subscription at any time. We may suspend or terminate
              your access if you violate these Terms or if we discontinue the Service, in which case we&apos;ll
              make a reasonable effort to give you notice and a chance to export your data first.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">10. Changes to these Terms</h2>
            <p>
              We may update these Terms from time to time. If we make material changes, we&apos;ll update the
              &quot;Last updated&quot; date above. Continuing to use the Service after changes take effect means
              you accept the updated Terms.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">11. Governing law</h2>
            <p>
              These Terms are governed by the laws of the State of Wisconsin, without regard to its conflict of
              law principles.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-display font-semibold text-ink mb-2">12. Contact us</h2>
            <p>
              Questions about these Terms? Reach out at{" "}
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
          <Link href="/privacy" className="hover:text-ink-soft">
            Privacy Policy
          </Link>
          <Link href="/contact" className="hover:text-ink-soft">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}
