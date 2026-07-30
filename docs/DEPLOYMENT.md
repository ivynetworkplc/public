# Deployment Guide — Ivy Network PLC Forms API

This guide assumes you have never deployed Cloudflare Workers before.
Follow each step in order.

---

## What you will deploy

- **Cloudflare Worker** named `ivy-forms-api` (handles form submissions)
- **Cloudflare D1** database named `ivy-forms-db` (stores submissions)

Your existing **Cloudflare Pages** site stays as it is. The Worker is a separate service.

---

## Prerequisites

1. A Cloudflare account that already hosts `ivynetwork.co.uk` on Pages.
2. Node.js 18+ installed on your computer ([nodejs.org](https://nodejs.org)).
3. Access to the GitHub repo `ivynetworkplc/public`.

---

## Step 1 — Install Wrangler (Cloudflare CLI)

Open a terminal and run:

```bash
npm install -g wrangler
```

Log in:

```bash
nwrangler login
```

(or `npx wrangler login`)

A browser window opens. Approve access for your Cloudflare account.

---

## Step 2 — Open the workers folder

```bash
git clone https://github.com/ivynetworkplc/public.git
cd public/workers
npm install
```

---

## Step 3 — Create the D1 database

```bash
npx wrangler d1 create ivy-forms-db
```

You will see output similar to:

```
[[d1_databases]]
binding = "DB"
database_name = "ivy-forms-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Copy the `database_id`.**

Open `workers/wrangler.jsonc` and replace:

```
REPLACE_WITH_YOUR_D1_DATABASE_ID
```

with your real database ID.

Commit the change if you use Git for deploys.

---

## Step 4 — Run database migrations

**Local (for testing):**

```bash
npx wrangler d1 migrations apply ivy-forms-db --local
```

**Production (remote):**

```bash
npx wrangler d1 migrations apply ivy-forms-db --remote
```

You should see tables created successfully.

---

## Step 5 — Deploy the Worker

```bash
npx wrangler deploy
```

Note the workers.dev URL printed, for example:

```
https://ivy-forms-api.<your-subdomain>.workers.dev
```

---

## Step 6 — Point the website forms at the Worker

Open `assets/js/forms-api.js` and set:

```js
var DEFAULT_API = 'https://ivy-forms-api.<your-subdomain>.workers.dev';
```

Or on any page, before loading the script:

```html
<script>window.IVY_FORMS_API = 'https://ivy-forms-api.<your-subdomain>.workers.dev';</script>
<script src="/assets/js/forms-api.js" defer></script>
```

Redeploy Cloudflare Pages (push to GitHub) so the updated contact form and client load.

---

## Step 7 — Configure CORS origins

In `wrangler.jsonc`, `ALLOWED_ORIGINS` already includes:

- `https://ivynetwork.co.uk`
- `https://www.ivynetwork.co.uk`

If you use a preview URL, add it and redeploy:

```bash
npx wrangler deploy
```

---

## Step 8 — Optional email notifications

Without email, submissions still save in D1.

To enable Resend (example):

```bash
npx wrangler secret put EMAIL_PROVIDER
# enter: resend

npx wrangler secret put EMAIL_API_KEY
# enter your Resend API key

npx wrangler secret put EMAIL_FROM
# enter: forms@ivynetwork.co.uk

npx wrangler secret put EMAIL_TO
# enter: team@ivynetwork.co.uk
```

Supported providers in code: `resend`, `sendgrid`, `mailchannels`, `none`.

---

## Step 9 — Optional admin API key

```bash
npx wrangler secret put ADMIN_API_KEY
# enter a long random string
```

List submissions:

```bash
curl -H "Authorization: Bearer YOUR_KEY" \
  "https://ivy-forms-api.<subdomain>.workers.dev/api/admin/contact"
```

---

## Step 10 — Test

### Health check

```bash
curl https://ivy-forms-api.<subdomain>.workers.dev/api/health
```

Expected: `{"success":true,"service":"ivy-forms-api",...}`

### Contact form

```bash
curl -X POST https://ivy-forms-api.<subdomain>.workers.dev/api/contact \
  -H "Content-Type: application/json" \
  -H "Origin: https://ivynetwork.co.uk" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "department": "General Support",
    "subject": "API test",
    "message": "This is a deployment test message.",
    "privacy_accepted": true
  }'
```

Expected: `{"success":true,"message":"Your message has been received...","id":"..."}`

### Newsletter

```bash
curl -X POST https://ivy-forms-api.<subdomain>.workers.dev/api/newsletter \
  -H "Content-Type: application/json" \
  -H "Origin: https://ivynetwork.co.uk" \
  -d '{"email":"subscriber@example.com"}'
```

### Check D1 data

```bash
npx wrangler d1 execute ivy-forms-db --remote --command "SELECT id, email, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 5"
```

---

## Step 11 — Custom domain (recommended)

In Cloudflare Dashboard:

1. **Workers & Pages** → **ivy-forms-api** → **Settings** → **Domains & Routes**
2. Add route: `ivynetwork.co.uk/api/*`  
   or a subdomain: `api.ivynetwork.co.uk/*`

If you use `https://ivynetwork.co.uk/api/...`, set:

```js
var DEFAULT_API = 'https://ivynetwork.co.uk';
```

Ensure Pages and Worker routes do not conflict. Using `api.ivynetwork.co.uk` is usually simplest.

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| `Database not configured` | Set real `database_id` in `wrangler.jsonc` and redeploy |
| CORS errors in browser | Add your site origin to `ALLOWED_ORIGINS` and redeploy |
| 429 Too many requests | Wait 1 minute; adjust `RATE_LIMIT_PER_MINUTE` |
| Migration errors | Run `migrations apply --remote` again; check SQL syntax |
| Forms still use mailto | Confirm `forms-api.js` is loaded and Worker URL is correct |
| Pages 404 on `/assets/js/forms-api.js` | Confirm file is in repo and Pages deployed latest commit |

---

## Checklist

- [ ] Wrangler installed and logged in
- [ ] D1 database `ivy-forms-db` created
- [ ] `database_id` set in `wrangler.jsonc`
- [ ] Migrations applied remotely
- [ ] Worker deployed
- [ ] Health endpoint returns success
- [ ] Test contact POST works
- [ ] Website form client points at Worker URL
- [ ] Cloudflare Pages redeployed
- [ ] Browser test from contact page succeeds
- [ ] (Optional) Email secrets configured
- [ ] (Optional) Custom API domain configured

---

© 2026 Ivy Network PLC · Tech Insiders Limited
