# Ivy Network PLC — Forms Backend

Production forms API for [ivynetwork.co.uk](https://ivynetwork.co.uk).

| Layer | Technology |
|-------|------------|
| API | Cloudflare Workers |
| Database | Cloudflare D1 |
| Frontend | Existing static HTML (unchanged design) |
| Client helper | `/assets/js/forms-api.js` |

## Endpoints

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/api/health` | Health check |
| POST | `/api/contact` | Contact form |
| POST | `/api/newsletter` | Newsletter |
| POST | `/api/partnership` | Partnerships |
| POST | `/api/support` | Support |
| POST | `/api/copyright` | Copyright reports |
| POST | `/api/feedback` | Feedback |
| GET | `/api/admin/:type` | List rows (admin key) |

## Response shape

Success:

```json
{ "success": true, "message": "Your message has been received.", "id": "uuid" }
```

Error:

```json
{ "success": false, "message": "Validation failed.", "fields": ["email"] }
```

## Repository layout

```
workers/
  src/
    index.js
    routes/forms.js
    utils/
  migrations/
  wrangler.jsonc
  package.json
assets/js/forms-api.js
docs/
  DEPLOYMENT.md
  DATABASE.md
  SECURITY.md
  README.md
```

## Quick start

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for a full beginner-friendly checklist.

```bash
cd workers
npm install
npx wrangler d1 create ivy-forms-db
# put database_id into wrangler.jsonc
npx wrangler d1 migrations apply ivy-forms-db --remote
npx wrangler deploy
```

## Frontend integration

```html
<script>window.IVY_FORMS_API = 'https://YOUR-WORKER.workers.dev';</script>
<script src="/assets/js/forms-api.js" defer></script>
<script>
  IvyForms.bindForm(document.getElementById('contactForm'), { type: 'contact' });
</script>
```

Design, colours, and layout of the site are intentionally not modified by this backend.
