/** Consistent JSON API responses */

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

export function success(message, extra = {}, status = 200) {
  return json({ success: true, message, ...extra }, status);
}

export function error(message, status = 400, extra = {}) {
  return json({ success: false, message, ...extra }, status);
}
