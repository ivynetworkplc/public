# Database Schema — Ivy Network PLC Forms (Cloudflare D1)

Engine: **SQLite** via Cloudflare D1  
Database name: **ivy-forms-db**

## Tables

### contact_messages
Main website contact form.

| Column | Type | Notes |
|--------|------|--------|
| id | TEXT PK | UUID |
| created_at / updated_at | TEXT | ISO datetime |
| status | TEXT | pending, contacted, resolved, closed, spam, archived |
| full_name, email, department, subject, message | TEXT | required |
| phone, company, country | TEXT | optional |
| privacy_accepted | INTEGER | 0/1 |
| ip_hash, user_agent, source_page | TEXT | privacy-safe metadata |

### newsletter_subscribers
| Column | Notes |
|--------|--------|
| email | UNIQUE |
| status | pending / archived (unsubscribed) |
| unsubscribed_at | set when user opts out |

### partnership_requests / support_requests / copyright_reports / feedback
Same pattern: id, timestamps, status, contact fields, message body, ip_hash.

### form_submissions
Generic store for future form types (`form_type` + `payload_json`).

### audit_logs
Security and operations events (honeypot, rate limit, submission, errors).

### rate_limits
Per-minute counters keyed by form type + IP hash.

## Status workflow (admin-ready)

`pending` → `contacted` → `resolved` / `closed`  
Or mark `spam` / `archived`.

## Migrations

Located in `workers/migrations/`:

1. `0001_initial.sql` — tables
2. `0002_indexes.sql` — indexes for email, status, created_at

Apply:

```bash
npx wrangler d1 migrations apply ivy-forms-db --remote
```

## Useful queries

```sql
SELECT status, COUNT(*) FROM contact_messages GROUP BY status;
SELECT * FROM contact_messages WHERE email LIKE '%@example.com%' ORDER BY created_at DESC LIMIT 20;
SELECT * FROM audit_logs WHERE event_type = 'rate_limit' ORDER BY created_at DESC LIMIT 50;
```
