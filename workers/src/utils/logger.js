/** Structured logging + optional audit row */

export function logEvent(level, event, fields = {}) {
  const entry = {
    level,
    event,
    ts: new Date().toISOString(),
    ...fields,
  };
  // Avoid logging raw emails/messages in production logs when possible
  console.log(JSON.stringify(entry));
}

export async function writeAudit(db, {
  event_type,
  form_type = null,
  submission_id = null,
  ip_hash = null,
  details = null,
  success = 1,
}) {
  try {
    await db
      .prepare(
        `INSERT INTO audit_logs (id, event_type, form_type, submission_id, ip_hash, details, success)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        event_type,
        form_type,
        submission_id,
        ip_hash,
        details ? String(details).slice(0, 1000) : null,
        success ? 1 : 0
      )
      .run();
  } catch (e) {
    console.error('audit_write_failed', e?.message || String(e));
  }
}
