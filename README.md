# Ivy Network PLC — Website & Forms API

Official website: [https://ivynetwork.co.uk](https://ivynetwork.co.uk)

Parent company: Tech Insiders Limited

## Site

Static HTML pages deployed on **Cloudflare Pages** from this repository.

## Forms backend

Enterprise form handling lives under `workers/`:

- **Cloudflare Workers** REST API
- **Cloudflare D1** database
- Shared browser client: `assets/js/forms-api.js`
- Contact page binder: `assets/js/contact-bind.js`

Documentation:

| Doc | Description |
|-----|-------------|
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Step-by-step deploy (beginner friendly) |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema and migrations |
| [docs/SECURITY.md](docs/SECURITY.md) | Security model |
| [docs/README.md](docs/README.md) | API overview |

### Contact page scripts

Add near the end of `contact.html` (before `</body>`), after the existing page script:

```html
<script>
  // After deploy, set to your Worker URL or custom API domain:
  window.IVY_FORMS_API = 'https://ivy-forms-api.YOUR_SUBDOMAIN.workers.dev';
</script>
<script src="/assets/js/forms-api.js" defer></script>
<script src="/assets/js/contact-bind.js" defer></script>
```

Until the Worker is deployed, the original mailto fallback in the page script still runs if these files are not loaded.

## Licence

© 2026 Ivy Network PLC. All Rights Reserved.
