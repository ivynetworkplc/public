# Frontend integration (no redesign)

## Contact page

At the **end** of `contact.html`, immediately **before** `</body>`, add:

```html
<script>
  window.IVY_FORMS_API = 'https://ivy-forms-api.YOUR_SUBDOMAIN.workers.dev';
</script>
<script src="/assets/js/forms-api.js" defer></script>
<script src="/assets/js/contact-bind.js" defer></script>
```

Replace `YOUR_SUBDOMAIN` with the subdomain shown after `wrangler deploy`.

### Behaviour

- Existing layout, colours, and validation messages stay the same.
- `contact-bind.js` replaces the old mailto flow with `POST /api/contact`.
- Loading state: submit button shows “Sending…”.
- Success/error messages use the existing success box (and an error alert if needed).

## Newsletter forms

Example:

```html
<form id="newsletterForm">
  <input type="email" name="email" required>
  <button type="submit">Subscribe</button>
  <p data-form-success style="display:none"></p>
</form>
<script src="/assets/js/forms-api.js"></script>
<script>
  IvyForms.bindForm(document.getElementById('newsletterForm'), { type: 'newsletter' });
</script>
```

## API base URL

Prefer a custom domain later:

```js
window.IVY_FORMS_API = 'https://api.ivynetwork.co.uk';
```
