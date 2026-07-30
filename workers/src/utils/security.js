/** CORS, rate limiting, IP hashing */

export function parseAllowedOrigins(env) {
  const raw = env.ALLOWED_ORIGINS || 'https://ivynetwork.co.uk';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = parseAllowedOrigins(env);
  const ok = allowed.includes(origin) || allowed.includes('*');
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
  if (ok && origin) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (!origin) {
    // Non-browser clients (curl) — no ACAO needed
  }
  return headers;
}

export function isOriginAllowed(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return true; // same-origin navigations / curl
  return parseAllowedOrigins(env).includes(origin);
}

/** SHA-256 hash of IP for privacy-safe storage */
export async function hashIp(ip) {
  if (!ip) return null;
  const data = new TextEncoder().encode(ip + '|ivy-forms');
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

export function clientIp(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

/**
 * Simple sliding-window rate limit stored in D1.
 * Returns { allowed: boolean, remaining: number }
 */
export async function checkRateLimit(db, key, limitPerMinute) {
  const limit = Number(limitPerMinute) || 10;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % 60);

  const row = await db
    .prepare('SELECT window_start, count FROM rate_limits WHERE key = ?')
    .bind(key)
    .first();

  if (!row || row.window_start !== windowStart) {
    await db
      .prepare(
        'INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)
         ON CONFLICT(key) DO UPDATE SET window_start = excluded.window_start, count = 1'
      )
      .bind(key, windowStart)
      .run();
    return { allowed: true, remaining: limit - 1 };
  }

  if (row.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await db
    .prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?')
    .bind(key)
    .run();

  return { allowed: true, remaining: limit - row.count - 1 };
}

export function newId() {
  return crypto.randomUUID();
}
