# Nuvrix Connect

A dependency-free, static B2B services website with nine pages and a server-side enquiry endpoint. The existing HTML/CSS foundation and Nuvrix mark are retained. The approved October 2026 brief is the source of positioning and service content.

## Local development

Requires Node.js 22. No npm dependencies or install step are needed.

```sh
npm run dev
```

Open http://127.0.0.1:8766. The server serves only `dist/`. After editing templates, content, CSS, or JavaScript, run `npm run build` and refresh. Changes to server code require a restart.

```sh
npm run build
npm test
```

`npm run build` regenerates the root HTML pages and a clean `dist/` deployment directory. `npm test` runs validation and delivery-contract tests without sending real email.

## Editing

- `src/services.json`: names, page URLs, service copy, scope, and related services.
- `src/build.mjs`: shared layout, navigation, homepage, service pages, contact page, metadata, and redirect fallbacks. Edit this file instead of generated HTML.
- `styles.css`: responsive, light, typography-led design.
- `script.js`: accessible navigation, service preselection, and contact-form states.
- `assets/nuvrix-mark.png`: preserved brand asset.
- `lib/enquiry.mjs`: validation, email delivery, and non-JavaScript confirmation response.
- `api/enquiries.mjs`: Vercel function entry point.
- `scripts/serve.mjs`: local/standalone Node server.

Earlier drafts and screenshots are retained in `previews/` and excluded from `dist/`. The old `content.md` and `design.md` are historical notes, not the current brief.

## Vercel deployment

Production is hosted on Vercel project `nuvrix` in the `arlinds-projects-c6cabf85` team, connected to the `main` branch of https://github.com/arlsusu22/nuvrix. The apex domain redirects to https://www.nuvrixconnect.com/.

The initial rebuild was published on 11 October 2026 from commit `cc2622d87b712adc6ff5fad2df08f13270767e19`, after a successful Vercel preview. Production deployment: https://vercel.com/arlinds-projects-c6cabf85/nuvrix/EstUFQmiNok4BgJqp8cDXhsSwVbT. The prior production commit is `7d0cdf99b025d62d0cf9b9bff9784708e384805f`.

Public checks passed for all nine pages, stylesheet, logos, sitemap, robots, four legacy redirects, the 404 response, and API validation. Actual email delivery and production email environment variables remain unverified; dashboard sign-in is required to finish configuration. No test email was sent.

`vercel.json` configures the static build, page routes, redirects, security headers, and `/api/enquiries` function. The release checkout used for publishing is `/private/tmp/nuvrix-production-20261011`; the editable project source remains this workspace. Future releases should use the same GitHub repository and Vercel project.

Use the repository root, the **Other** framework preset, Node.js **22.x**, build command `npm run build`, and output directory `dist`. Deploy the project source, not just the `dist` folder: the serverless function lives in `api/` and imports `lib/enquiry.mjs` and `src/services.json`.

### Required enquiry configuration

The email provider is Resend. Add these server-side environment variables in Vercel:

| Variable | Required value |
| --- | --- |
| `RESEND_API_KEY` | A Resend key permitted to send email. |
| `ENQUIRY_FROM_EMAIL` | An approved sender on a domain verified in Resend. |
| `ENQUIRY_TO_EMAIL` | The approved recipient mailbox for enquiries. |
| `SITE_URL` | `https://www.nuvrixconnect.com` on production. Use the actual preview origin on a preview deployment if setting this variable there. |

No sender or recipient is silently assumed. `info@nuvrixconnect.com` is retained as a visible fallback because it was already published on the existing website. Confirm that it is monitored before launch.

For local delivery testing, copy `.env.example` to `.env`, supply the email settings, and use `SITE_URL=http://127.0.0.1:8766`. The `.env` file is ignored and never copied into the public build. For a standalone Node host, `HOST=0.0.0.0` may be required; trust forwarded IP headers only behind a controlled proxy.

Without the required email settings, a valid enquiry returns HTTP 503 and the form explicitly says it was not sent. The browser retains the entered details. Success is shown only when the provider returns an accepted email receipt. Provider acceptance does not claim mailbox delivery. The same request identifier is reused on retries to avoid duplicate provider submissions after an uncertain response.

The endpoint has field validation, a honeypot, body-size checks, origin checks, and a best-effort per-instance attempt limit. In a multi-instance Vercel deployment, configure a shared Vercel Firewall rate limit for `/api/enquiries` as appropriate; the in-memory limit is not a global quota.

Provider documentation: https://resend.com/docs/api-reference/emails/send-email
Vercel function documentation: https://vercel.com/docs/functions/runtimes/node-js

### Before launch

1. Configure the sender, recipient, API key, and production origin.
2. Test one real enquiry end to end and verify receipt in the intended mailbox. Automated tests use a simulated email provider; no live delivery has been verified.
3. Confirm the existing public contact mailbox and any required approved legal/privacy content. No approved legal pages were present in the supplied project, so none were fabricated.
4. Verify the routes and legacy redirects on a Vercel preview deployment, then publish through the existing production project.

Projects are quoted after scoping. No public prices, certifications, customer proof, booking links, or outcome guarantees have been added.

## Pages and redirects

- `/`
- `/services`
- `/services/outbound-stack-setup`
- `/services/outbound-automation`
- `/services/outbound-intelligence`
- `/services/crm-sales-operations`
- `/services/managed-outbound-operations`
- `/services/outbound-team-setup`
- `/contact`

Existing `/how-it-runs.html` and `/run.html` redirect to Managed Outbound Operations. `/about-us.html` goes to the homepage’s “How we work” section; `/pricing.html` goes to `/contact`; `/run.html` goes to Managed Outbound Operations. Vercel and the Node server use permanent HTTP redirects. Static HTML redirect fallbacks are also generated.

A sitemap, robots file, and custom 404 page are included. Assets and frontend code are self-hosted; the site does not use analytics or third-party browser scripts.

## Service illustrations

All six service detail pages use the SVG process illustrations in `src/service-art.mjs`. Animation runs only while the illustration is visible, includes a pause/play control, and is disabled for reduced-motion preferences. Outbound Team Setup covers hiring support, tools, training, ramp-up support, and handover; ongoing people management is separately scoped.
