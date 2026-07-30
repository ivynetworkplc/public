/**
 * Ivy Network PLC — Forms API
 * Cloudflare Worker + D1
 */

import { json, error } from './utils/response.js';
import { corsHeaders, isOriginAllowed } from './utils/security.js';
import { handleFormPost, handleAdminList } from './routes/forms.js';
import { logEvent } from './utils/logger.js';

const ROUTES = {
  '/api/contact': 'contact',
  '/api/newsletter': 'newsletter',
  '/api/partnership': 'partnership',
  '/api/support': 'support',
  '/api/copyright': 'copyright',
  '/api/feedback': 'feedback',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    const cors = corsHeaders(request, env);

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // Health
    if (path === '/api/health' || path === '/health') {
      return json(
        {
          success: true,
          service: 'ivy-forms-api',
          environment: env.ENVIRONMENT || 'production',
          time: new Date().toISOString(),
        },
        200,
        cors
      );
    }

    // Origin check for browser requests
    if (!isOriginAllowed(request, env) && request.headers.get('Origin')) {
      logEvent('warn', 'origin_blocked', { origin: request.headers.get('Origin') });
      return error('Origin not allowed', 403, {}, cors);
    }

    // Admin list: GET /api/admin/:type
    const adminMatch = path.match(/^\/api\/admin\/([a-z]+)$/);
    if (adminMatch && request.method === 'GET') {
      const res = await handleAdminList(request, env, adminMatch[1]);
      return withCors(res, cors);
    }

    // Form posts
    const formType = ROUTES[path];
    if (formType) {
      if (request.method !== 'POST') {
        return withCors(error('Method not allowed', 405), cors);
      }
      if (!env.DB) {
        return withCors(
          error('Database not configured. Set D1 binding in wrangler.jsonc.', 503),
          cors
        );
      }
      try {
        const res = await handleFormPost(request, env, formType);
        return withCors(res, cors);
      } catch (e) {
        logEvent('error', 'unhandled', { err: e?.message || String(e) });
        return withCors(error('Internal server error', 500), cors);
      }
    }

    // Generic form endpoint for future form types
    if (path === '/api/submit' && request.method === 'POST') {
      // Body must include form_type
      try {
        const body = await request.clone().json();
        const t = body.form_type;
        if (t && ROUTES[`/api/${t}`]) {
          const res = await handleFormPost(request, env, t);
          return withCors(res, cors);
        }
        // Store in generic table via feedback-like path
        const res = await handleFormPost(request, env, 'feedback');
        return withCors(res, cors);
      } catch {
        return withCors(error('Invalid request', 400), cors);
      }
    }

    return withCors(
      json({
        success: true,
        message: 'Ivy Network PLC Forms API',
        endpoints: Object.keys(ROUTES),
      }),
      cors
    );
  },
};

function withCors(response, cors) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(cors)) {
    headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Fix error() when extra headers object passed as 4th arg incorrectly
function error(message, status = 400, extra = {}) {
  return json({ success: false, message, ...extra }, status);
}
