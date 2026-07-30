import { success, error } from '../utils/response.js';
import {
  trimStr,
  isValidEmail,
  requireFields,
  isHoneypotTriggered,
  sanitizeMessage,
  parseJsonBody,
} from '../utils/validation.js';
import { newId, hashIp, clientIp, checkRateLimit } from '../utils/security.js';
import { notifyEmail } from '../utils/email.js';
import { logEvent, writeAudit } from '../utils/logger.js';

const FORM_CONFIG = {
  contact: {
    table: 'contact_messages',
    required: ['full_name', 'email', 'department', 'subject', 'message'],
    fields: [
      'full_name', 'email', 'phone', 'company', 'country',
      'department', 'subject', 'message', 'privacy_accepted',
    ],
  },
  newsletter: {
    table: 'newsletter_subscribers',
    required: ['email'],
    fields: ['email', 'full_name'],
  },
  partnership: {
    table: 'partnership_requests',
    required: ['full_name', 'email', 'message'],
    fields: [
      'full_name', 'email', 'phone', 'company', 'country',
      'website', 'partnership_type', 'message',
    ],
  },
  support: {
    table: 'support_requests',
    required: ['full_name', 'email', 'subject', 'message'],
    fields: [
      'full_name', 'email', 'phone', 'category', 'subject',
      'message', 'priority',
    ],
  },
  copyright: {
    table: 'copyright_reports',
    required: ['full_name', 'email', 'description'],
    fields: [
      'full_name', 'email', 'phone', 'company', 'work_title',
      'work_url', 'infringing_url', 'description', 'ownership_statement',
    ],
  },
  feedback: {
    table: 'feedback',
    required: ['message'],
    fields: ['full_name', 'email', 'rating', 'category', 'message'],
  },
};

async function insertRow(db, table, id, data, common) {
  if (table === 'contact_messages') {
    return db
      .prepare(
        `INSERT INTO contact_messages (
          id, full_name, email, phone, company, country, department,
          subject, message, privacy_accepted, ip_hash, user_agent, source_page
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        data.full_name,
        data.email,
        data.phone || null,
        data.company || null,
        data.country || null,
        data.department,
        data.subject,
        data.message,
        data.privacy_accepted ? 1 : 0,
        common.ip_hash,
        common.user_agent,
        common.source_page
      )
      .run();
  }

  if (table === 'newsletter_subscribers') {
    // Upsert by email — re-subscribe clears unsubscribed_at
    return db
      .prepare(
        `INSERT INTO newsletter_subscribers (id, email, full_name, source_page, ip_hash, user_agent, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')
         ON CONFLICT(email) DO UPDATE SET
           updated_at = datetime('now'),
           status = 'pending',
           unsubscribed_at = NULL,
           full_name = COALESCE(excluded.full_name, newsletter_subscribers.full_name),
           source_page = excluded.source_page`
      )
      .bind(
        id,
        data.email,
        data.full_name || null,
        common.source_page,
        common.ip_hash,
        common.user_agent
      )
      .run();
  }

  if (table === 'partnership_requests') {
    return db
      .prepare(
        `INSERT INTO partnership_requests (
          id, full_name, email, phone, company, country, website,
          partnership_type, message, ip_hash, user_agent, source_page
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        data.full_name,
        data.email,
        data.phone || null,
        data.company || null,
        data.country || null,
        data.website || null,
        data.partnership_type || null,
        data.message,
        common.ip_hash,
        common.user_agent,
        common.source_page
      )
      .run();
  }

  if (table === 'support_requests') {
    return db
      .prepare(
        `INSERT INTO support_requests (
          id, full_name, email, phone, category, subject, message,
          priority, ip_hash, user_agent, source_page
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        data.full_name,
        data.email,
        data.phone || null,
        data.category || null,
        data.subject,
        data.message,
        data.priority || 'normal',
        common.ip_hash,
        common.user_agent,
        common.source_page
      )
      .run();
  }

  if (table === 'copyright_reports') {
    return db
      .prepare(
        `INSERT INTO copyright_reports (
          id, full_name, email, phone, company, work_title, work_url,
          infringing_url, description, ownership_statement,
          ip_hash, user_agent, source_page
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        data.full_name,
        data.email,
        data.phone || null,
        data.company || null,
        data.work_title || null,
        data.work_url || null,
        data.infringing_url || null,
        data.description,
        data.ownership_statement || null,
        common.ip_hash,
        common.user_agent,
        common.source_page
      )
      .run();
  }

  if (table === 'feedback') {
    const rating = data.rating != null ? Number(data.rating) : null;
    return db
      .prepare(
        `INSERT INTO feedback (
          id, full_name, email, rating, category, message,
          ip_hash, user_agent, source_page
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        data.full_name || null,
        data.email || null,
        rating && rating >= 1 && rating <= 5 ? rating : null,
        data.category || null,
        data.message,
        common.ip_hash,
        common.user_agent,
        common.source_page
      )
      .run();
  }

  // Generic fallback
  return db
    .prepare(
      `INSERT INTO form_submissions (
        id, form_type, full_name, email, phone, company, country,
        subject, message, payload_json, ip_hash, user_agent, source_page
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      table,
      data.full_name || null,
      data.email || null,
      data.phone || null,
      data.company || null,
      data.country || null,
      data.subject || null,
      data.message || data.description || null,
      JSON.stringify(data),
      common.ip_hash,
      common.user_agent,
      common.source_page
    )
    .run();
}

export async function handleFormPost(request, env, formType) {
  const config = FORM_CONFIG[formType];
  if (!config) {
    return error('Unknown form type', 404);
  }

  const maxBytes = Number(env.MAX_BODY_BYTES) || 32768;
  const raw = await request.text();
  const parsed = parseJsonBody(raw, maxBytes);
  if (parsed.error) {
    logEvent('warn', 'invalid_body', { formType, reason: parsed.error });
    return error(parsed.error, 400);
  }

  const body = parsed.data;

  if (isHoneypotTriggered(body)) {
    const ip = clientIp(request);
    const ip_hash = await hashIp(ip);
    await writeAudit(env.DB, {
      event_type: 'honeypot',
      form_type: formType,
      ip_hash,
      success: 0,
      details: 'honeypot_triggered',
    });
    logEvent('warn', 'honeypot', { formType, ip_hash });
    // Silent success to not tip off bots
    return success('Your message has been received.');
  }

  const ip = clientIp(request);
  const ip_hash = await hashIp(ip);
  const rlKey = `rl:${formType}:${ip_hash || 'anon'}`;
  const rl = await checkRateLimit(env.DB, rlKey, env.RATE_LIMIT_PER_MINUTE);
  if (!rl.allowed) {
    await writeAudit(env.DB, {
      event_type: 'rate_limit',
      form_type: formType,
      ip_hash,
      success: 0,
    });
    logEvent('warn', 'rate_limit', { formType, ip_hash });
    return error('Too many requests. Please try again in a minute.', 429);
  }

  // Normalise fields
  const data = {};
  for (const f of config.fields) {
    if (f === 'privacy_accepted') {
      data[f] = Boolean(body.privacy_accepted || body.privacy);
      continue;
    }
    if (f === 'message' || f === 'description' || f === 'ownership_statement') {
      data[f] = sanitizeMessage(body[f] || body.message, 10000);
      continue;
    }
    if (f === 'rating') {
      data[f] = body[f];
      continue;
    }
    data[f] = trimStr(body[f], f === 'subject' ? 300 : 500);
  }
  // Map description for copyright required check
  if (formType === 'copyright' && !data.description) {
    data.description = sanitizeMessage(body.message, 10000);
  }

  const missing = requireFields(data, config.required);
  if (missing.length) {
    logEvent('info', 'validation_failed', { formType, missing });
    return error('Validation failed.', 400, { fields: missing });
  }

  if (data.email && !isValidEmail(data.email)) {
    return error('Please provide a valid email address.', 400, { fields: ['email'] });
  }

  if (formType === 'contact' && !data.privacy_accepted) {
    return error('Please accept the Privacy Policy.', 400, { fields: ['privacy_accepted'] });
  }

  if (data.message && data.message.length < 5 && formType !== 'newsletter') {
    return error('Message is too short.', 400, { fields: ['message'] });
  }

  const id = newId();
  const common = {
    ip_hash,
    user_agent: trimStr(request.headers.get('User-Agent'), 400),
    source_page: trimStr(body.source_page || request.headers.get('Referer'), 500),
  };

  try {
    await insertRow(env.DB, config.table, id, data, common);
  } catch (e) {
    logEvent('error', 'db_insert_failed', { formType, err: e?.message || String(e) });
    await writeAudit(env.DB, {
      event_type: 'db_error',
      form_type: formType,
      ip_hash,
      success: 0,
      details: e?.message || 'db_error',
    });
    return error('Unable to save your submission. Please try again later.', 500);
  }

  await writeAudit(env.DB, {
    event_type: 'submission',
    form_type: formType,
    submission_id: id,
    ip_hash,
    success: 1,
  });

  logEvent('info', 'submission_ok', { formType, id });

  // Fire-and-forget style email (awaited briefly for reliability)
  const emailText = [
    `Form: ${formType}`,
    `ID: ${id}`,
    data.full_name ? `Name: ${data.full_name}` : null,
    data.email ? `Email: ${data.email}` : null,
    data.department ? `Department: ${data.department}` : null,
    data.subject ? `Subject: ${data.subject}` : null,
    data.message || data.description || '',
  ]
    .filter(Boolean)
    .join('\n');

  await notifyEmail(env, {
    subject: `[Ivy Forms] ${formType} — ${data.subject || data.email || id}`,
    text: emailText,
    replyTo: data.email || undefined,
  });

  const messages = {
    contact: 'Your message has been received. Our team will respond as soon as possible.',
    newsletter: 'You are subscribed. Thank you for joining the Ivy Network PLC mailing list.',
    partnership: 'Your partnership request has been received.',
    support: 'Your support request has been received.',
    copyright: 'Your copyright report has been received and will be reviewed.',
    feedback: 'Thank you for your feedback.',
  };

  return success(messages[formType] || 'Your submission has been received.', { id });
}

/** Future admin: list submissions (requires ADMIN_API_KEY) */
export async function handleAdminList(request, env, formType) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!env.ADMIN_API_KEY || token !== env.ADMIN_API_KEY) {
    return error('Unauthorized', 401);
  }

  const config = FORM_CONFIG[formType];
  if (!config) return error('Unknown form type', 404);

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);
  const offset = Number(url.searchParams.get('offset')) || 0;

  let sql = `SELECT * FROM ${config.table}`;
  const binds = [];
  if (status) {
    sql += ' WHERE status = ?';
    binds.push(status);
  }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  binds.push(limit, offset);

  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  return success('OK', { items: results || [], limit, offset });
}
