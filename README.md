# FlipTrackr — deployment guide

This is a real, multi-tenant web app: anyone who signs up gets their own private
pallets/items/sales/expenses, and pays you a monthly subscription (via Stripe) to
keep using it. This guide walks you through getting it live, start to finish, with
no coding required — just following steps and pasting values into forms.

You'll need three free/low-cost accounts:

- **Supabase** (database + login) — free to start
- **Stripe** (payments) — free, they take a small % per transaction
- **Vercel** (hosting) — free to start, ~$20/mo once you outgrow the free tier

Budget about an hour for the first pass.

---

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com), sign up, and click **New project**.
2. Pick a name (e.g. "fliptrackr"), a strong database password (save it somewhere —
   you likely won't need it again, but keep it safe), and a region close to your
   customers. Wait a minute or two for it to provision.
3. In the left sidebar, go to **SQL Editor** → **New query**. Open the file
   `supabase/migrations/0001_init.sql` from this project, copy its entire contents,
   paste it into the editor, and click **Run**. This creates all the tables and
   security rules. You should see "Success. No rows returned."
4. Go to **Project Settings → API**. You'll need three values from this page in a
   minute:
   - **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (click "Reveal") → this is `SUPABASE_SERVICE_ROLE_KEY`.
     Treat this one like a master password — never put it in anything that reaches
     a browser.
5. Go to **Authentication → URL Configuration**. Once you know your production URL
   (step 4 below), set **Site URL** to it (e.g. `https://fliptrackr.com`), and
   add `https://YOUR-DOMAIN/auth/callback` under **Redirect URLs**. You can leave
   these pointed at `http://localhost:3000` for now and come back after you deploy.
6. Optional but recommended: **Authentication → Email Templates** — Supabase sends
   a default-branded confirmation email out of the box. You can customize the
   wording/logo later; it works fine as-is to start.

Your database is done. Every signup automatically gets a private `profiles` row,
and row-level security means one customer can never see another's data — that's
enforced by the database itself, not just the app code.

---

## 2. Create your Stripe product

1. Go to [stripe.com](https://stripe.com) and create an account (or log into an
   existing one). Complete their business verification when prompted — you can
   test everything in **Test mode** before that's finished.
2. Make sure you're in **Test mode** (toggle, top right) while you set things up.
3. Go to **Product catalog → Add product**. Name it (e.g. "FlipTrackr Pro"),
   set a recurring price (e.g. $19.00/month), and save. Click into the price you
   just created and copy its **Price ID** (starts with `price_`) — this is
   `STRIPE_PRICE_ID`.
4. Go to **Developers → API keys**. Copy the **Secret key** (starts with `sk_test_`
   in test mode) — this is `STRIPE_SECRET_KEY`.
5. You'll set up the webhook (`STRIPE_WEBHOOK_SECRET`) in step 4, after you have a
   live URL for Stripe to send events to.

---

## 3. Push this code to GitHub

1. Create a new empty repository on [github.com](https://github.com) (don't
   initialize it with a README).
2. From this project's folder:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```

---

## 4. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com), sign up with your GitHub account.
2. Click **Add New → Project**, and import the repository you just pushed.
3. Before deploying, open **Environment Variables** and add every value from
   `.env.example`, using the real values you collected above:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID`
   - `STRIPE_WEBHOOK_SECRET` — put a placeholder like `whsec_pending` for now,
     you'll update it in a minute
   - `NEXT_PUBLIC_SITE_URL` — your Vercel URL, e.g. `https://fliptrackr.vercel.app`
     (or your custom domain if you're adding one now — see step 6)
   - `NEXT_PUBLIC_PLAN_NAME` and `NEXT_PUBLIC_PLAN_PRICE_DISPLAY` — cosmetic text
     for the pricing page, e.g. `Pro` and `$19/mo`
4. Click **Deploy**. After a couple of minutes you'll have a live URL.
5. Go back to **Supabase → Authentication → URL Configuration** and update the
   Site URL and Redirect URLs to your real Vercel URL (or custom domain), as
   mentioned in step 1.5.

## 5. Connect the Stripe webhook

This is what tells your app "this customer just paid" so it can unlock their
account.

1. In Stripe, go to **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://YOUR-DOMAIN/api/stripe/webhook`
3. Select these events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Save, then click into the endpoint you just created and reveal its
   **Signing secret** (starts with `whsec_`).
5. Back in Vercel, update the `STRIPE_WEBHOOK_SECRET` environment variable with
   this value, then redeploy (**Deployments → ⋯ → Redeploy** on the latest one).

## 6. (Optional) Custom domain

In Vercel, go to your project → **Settings → Domains** and add your domain,
following their DNS instructions (usually one CNAME record at your registrar).
Once it's live, update `NEXT_PUBLIC_SITE_URL` in Vercel's environment variables
to the new domain, update Supabase's Site URL/Redirect URLs to match, and
redeploy.

## 7. Test the whole flow before going live

With Stripe still in **Test mode**:

1. Visit your live URL → **Get started** → create an account with a real
   email you can check → confirm the email → you should land on the dashboard.
2. Go to **Billing → Subscribe**. Use Stripe's test card `4242 4242 4242 4242`,
   any future expiry date, any CVC. You should be redirected back and the
   dashboard should show as active (no more "No plan" badge).
3. Add a pallet, break it into a couple of items, log a sale, add an expense —
   confirm the dashboard math looks right.
4. Open the same account in an incognito window / different browser and confirm
   you're asked to log in — then create a *second* test account and confirm it
   starts completely empty (this proves each customer's data is isolated).
5. In Stripe, go to **Developers → Webhooks**, click your endpoint, and check the
   event log shows successful (200) deliveries.

## 8. Go live

1. In Stripe, flip from **Test mode** to **Live mode** (top right), finish
   business verification if you haven't, and redo steps 2–5 in Live mode (new
   live Price ID, live Secret key, a live-mode webhook endpoint with its own
   signing secret). Update those three env vars in Vercel with the live values
   and redeploy.
2. Update the placeholder pricing text (`NEXT_PUBLIC_PLAN_PRICE_DISPLAY`) if it's
   changed since you set it up.

---

## 9. (Optional) Connect AWeber for your mailing list

When someone becomes a paying subscriber (their Stripe subscription goes
active — not just when they create an account), they're automatically added
to an AWeber list. This is one-time setup in AWeber's developer portal, plus
a run of the SQL migration below.

1. **Run the migration.** Paste `supabase/migrations/0005_add_app_settings.sql`
   into Supabase's SQL Editor and run it. This adds a small table the app uses
   to store AWeber's access/refresh tokens, since they rotate over time and a
   static env var alone isn't durable enough.
2. **Create an AWeber developer app.** Sign up for a free account at
   [labs.aweber.com](https://labs.aweber.com), go to **API Apps → Create an
   App**, and set the redirect URI to exactly:
   ```
   urn:ietf:wg:oauth:2.0:oob
   ```
   This "out of band" redirect means AWeber shows you the authorization code
   directly on screen instead of needing a callback server. Grant it the
   `account.read`, `list.read`, and `subscriber.write` scopes. Save it and
   copy the **Client ID** and **Client Secret**.
3. **Authorize once, in your browser.** Visit this URL (with your own client
   ID swapped in), logged into the AWeber account you want subscribers added
   to:
   ```
   https://auth.aweber.com/oauth2/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=urn:ietf:wg:oauth:2.0:oob&scope=account.read+list.read+subscriber.write
   ```
   Click Allow, and AWeber shows you an authorization code — copy it.
4. **Exchange that code for tokens.** Run this from a terminal (swap in your
   client ID, client secret, and the code from the last step):
   ```
   curl -u "YOUR_CLIENT_ID:YOUR_CLIENT_SECRET" https://auth.aweber.com/oauth2/token -d grant_type=authorization_code -d code=YOUR_CODE -d redirect_uri=urn:ietf:wg:oauth:2.0:oob
   ```
   The response includes an `access_token` and a `refresh_token` — you only
   need the `refresh_token` going forward.
5. **Find your account ID and list ID.** Using the `access_token` from the
   last step:
   ```
   curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" https://api.aweber.com/1.0/accounts
   ```
   gives you your account ID; then
   ```
   curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" https://api.aweber.com/1.0/accounts/YOUR_ACCOUNT_ID/lists
   ```
   lists your mailing lists by name so you can pick the right list ID.
6. **Add the five env vars to Vercel** and redeploy: `AWEBER_CLIENT_ID`,
   `AWEBER_CLIENT_SECRET`, `AWEBER_REFRESH_TOKEN` (the one from step 4),
   `AWEBER_ACCOUNT_ID`, `AWEBER_LIST_ID`.

After that, the app takes care of keeping the access token fresh on its own —
`AWEBER_REFRESH_TOKEN` is only ever used once, to seed the database; every
refresh after that updates the database instead. If a subscriber add ever
fails, it's logged but never blocks checkout or the webhook — a mailing list
hiccup should never get in the way of somebody paying you.

---

## Things worth doing before you actually sell access

- **Terms of Service & Privacy Policy.** You're holding other people's business
  data — even a simple, honest policy (there are free generators, or a lawyer if
  you want it done properly) protects you and your customers. Link them from the
  landing page footer.
- **Support channel.** An email address customers can reach you at when something
  breaks or they have a billing question.
- **Backups.** Supabase backs up paid-tier projects automatically; on the free
  tier, consider exporting your database periodically once you have real
  customers depending on it.
- **Refund/cancellation policy.** Decide it upfront and put it on the pricing
  page — Stripe's customer portal (linked from the Billing page) already lets
  customers self-serve cancel.

## Local development

```
npm install
cp .env.example .env.local   # fill in your Supabase/Stripe test values
npm run dev
```

Then open http://localhost:3000. For Stripe webhooks locally, use the
[Stripe CLI](https://stripe.com/docs/stripe-cli): `stripe listen --forward-to
localhost:3000/api/stripe/webhook` — it prints a webhook signing secret to put
in `.env.local` while you're testing locally.

## Project structure

```
src/app/                    Pages & routes (Next.js App Router)
  page.tsx                  Public landing page
  pricing/                  Public pricing page
  login/ signup/ ...        Auth pages
  auth/actions.ts           Sign up / log in / log out / password reset
  (app)/                    Everything behind login (route group, no URL prefix)
    layout.tsx              Shell (nav, subscription badge) + auth check
    dashboard/ pallets/ items/ sales/ expenses/ billing/
  api/stripe/                Checkout, billing portal, and webhook routes
  api/export/                CSV export routes
src/lib/calc.ts             All the cost-allocation & reporting math, in one place
src/lib/app-context.ts      Loads the current user + subscription, gates pages
src/lib/supabase/           Supabase client setup (server, admin, middleware)
supabase/migrations/        Database schema + row-level security policies
```
