# Security Model — Ivy Forms API

## Controls implemented

1. **CORS allowlist** — only configured origins may call the API from browsers.
2. **Rate limiting** — per IP hash + form type, default 10 requests/minute (D1-backed).
3. **Honeypot fields** — hidden fields (`website_url`, `honeypot`, etc.); bots get a fake success.
4. **Input validation** — required fields, email format, length limits, trim, control-char stripping.
5. **Prepared statements** — all SQL uses bound parameters (D1).
6. **IP hashing** — SHA-256 truncated hash stored, not raw IP.
7. **Body size limit** — default 32 KB.
8. **No secrets in frontend** — API is public write-only; admin reads need `ADMIN_API_KEY`.
9. **Structured audit log** — honeypot, rate limit, validation, DB errors.
10. **Secure response headers** — `X-Content-Type-Options: nosniff`, `Cache-Control: no-store`.

## Threat mitigation

| Threat | Mitigation |
|--------|------------|
| Spam floods | Rate limit + honeypot |
| SQL injection | Bound parameters only |
| XSS via stored content | Admin UI must escape; API returns JSON only |
| CSRF | CORS + JSON POST (not cookie session auth for public forms) |
| Data scraping admin | Bearer admin key required |
| Secret leak | Wrangler secrets, never commit keys |

## Operational advice

- Rotate `ADMIN_API_KEY` periodically.
- Review `audit_logs` weekly for rate_limit / honeypot spikes.
- Keep `ALLOWED_ORIGINS` minimal.
- Enable Cloudflare Bot Fight Mode / WAF on the Worker route if abuse appears.
