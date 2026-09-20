/**
 * The app is served from a single origin per environment. `ALLOWED_ORIGINS` is
 * a comma-separated list; when it is unset every origin is allowed, which is
 * convenient for local development and should not be relied on in production.
 */
const allowList = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  const allowed = allowList.length === 0 || allowList.includes(origin);

  return {
    'Access-Control-Allow-Origin': allowed && origin ? origin : (allowList[0] ?? '*'),
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

export function jsonResponse(
  request: Request,
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}

export function errorResponse(request: Request, message: string, status: number): Response {
  return jsonResponse(request, { error: message }, status);
}
