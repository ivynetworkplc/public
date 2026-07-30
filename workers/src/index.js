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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    const cors = corsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

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

    if (!isOriginAllowed(request, env) && request.headers.get('Origin')) {
      logEvent('warn', 'origin_blocked', { origin: request.headers.get('Origin') });
      return withCors(error('Origin not allowed', 403), cors);
    }

    const adminMatch = path.match(/^\/api\/admin\/([a-z]+)$/);
    if (adminMatch && request.method === 'GET') {
      const res = await handleAdminList(request, env, adminMatch[1]);
      return withCors(res, cors);
    }

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

    if (path === '/api/submit' && request.method === 'POST') {
      try {
        const body = await request.clone().json();
        const t = body.form_type;
        if (t && ROUTES[`/api/${t}`]) {
          const res = await handleFormPost(request, env, t);
          return withCors(res, cors);
        }
        return withCors(error('Unknown form_type', 400), cors);
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
