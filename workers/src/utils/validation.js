/** Input validation and sanitisation */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export function trimStr(v, max = 500) {
  if (v == null) return '';
  return String(v).trim().slice(0, max);
}

export function isValidEmail(email) {
  if (!email || email.length > 254) return false;
  return EMAIL_RE.test(email);
}

export function requireFields(obj, fields) {
  const missing = [];
  for (const f of fields) {
    const val = obj[f];
    if (val == null || String(val).trim() === '') missing.push(f);
  }
  return missing;
}

/** Honeypot: bots fill hidden fields named website / url / company_url */
export function isHoneypotTriggered(body) {
  const traps = ['website_url', 'url', 'company_url', 'fax', 'honeypot'];
  for (const t of traps) {
    if (body[t] && String(body[t]).trim() !== '') return true;
  }
  return false;
}

export function sanitizeMessage(text, max = 10000) {
  return trimStr(text, max).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

export function parseJsonBody(raw, maxBytes) {
  if (raw == null || raw === '') {
    return { error: 'Empty request body' };
  }
  if (typeof raw === 'string' && raw.length > maxBytes) {
    return { error: 'Request body too large' };
  }
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      return { error: 'Invalid JSON object' };
    }
    return { data };
  } catch {
    return { error: 'Malformed JSON' };
  }
}
