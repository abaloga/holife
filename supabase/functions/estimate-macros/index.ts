// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';
import { z } from 'https://esm.sh/zod@3.23.8';
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';

/**
 * estimate-macros
 * ---------------------------------------------------------------------------
 * Turns a meal description (and optionally a photo) into a *draft* set of
 * macros for the user to review.
 *
 * Everything about the model lives here, on the server:
 *   - OPENAI_API_KEY never leaves this environment.
 *   - OPENAI_MACRO_MODEL selects the model, so changing it is a config change
 *     rather than a code change or a client release.
 *
 * The client cannot choose a model, cannot influence the system prompt beyond
 * its meal description, and never receives anything that has not been parsed
 * against the schema below.
 */

const DEFAULT_MODEL = 'gpt-5.6-luna';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

const requestSchema = z
  .object({
    description: z.string().trim().max(1500).optional(),
    imageBase64: z.string().max(12_000_000).optional(),
    imageMimeType: z.enum(ACCEPTED_IMAGE_TYPES).optional(),
  })
  .refine(
    (value) => Boolean(value.description?.trim()) || Boolean(value.imageBase64),
    'Provide a description, an image, or both.',
  )
  .refine(
    (value) => !value.imageBase64 || Boolean(value.imageMimeType),
    'An image must be sent with its MIME type.',
  );

const estimateSchema = z.object({
  mealName: z.string().trim().min(1).max(160),
  calories: z.number().finite().min(0).max(20000),
  proteinGrams: z.number().finite().min(0).max(2000),
  carbohydrateGrams: z.number().finite().min(0).max(2000),
  fatGrams: z.number().finite().min(0).max(2000),
  confidence: z.enum(['low', 'medium', 'high']),
  assumptions: z.array(z.string().trim().min(1).max(240)).max(8),
  components: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        portion: z.string().trim().max(80).optional(),
        calories: z.number().finite().min(0).max(20000).optional(),
      }),
    )
    .max(20)
    .optional(),
});

/** JSON Schema handed to the model. Mirrors `estimateSchema` exactly. */
const OUTPUT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'mealName',
    'calories',
    'proteinGrams',
    'carbohydrateGrams',
    'fatGrams',
    'confidence',
    'assumptions',
    'components',
  ],
  properties: {
    mealName: { type: 'string', description: 'A short, natural name for the meal.' },
    calories: { type: 'number', description: 'Total energy in kilocalories.' },
    proteinGrams: { type: 'number' },
    carbohydrateGrams: { type: 'number' },
    fatGrams: { type: 'number' },
    confidence: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
      description:
        'low when portion sizes or ingredients are genuinely unclear; high only when the description is specific about quantities.',
    },
    assumptions: {
      type: 'array',
      maxItems: 8,
      items: { type: 'string' },
      description:
        'Short statements of what you assumed, especially portion sizes, cooking fats and anything not stated.',
    },
    components: {
      type: 'array',
      maxItems: 20,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'portion', 'calories'],
        properties: {
          name: { type: 'string' },
          portion: { type: 'string' },
          calories: { type: 'number' },
        },
      },
      description: 'The individual items you counted, so the user can check them.',
    },
  },
} as const;

const SYSTEM_PROMPT = [
  'You estimate the nutritional content of meals from a description and, when provided, a photo.',
  '',
  'Rules:',
  '- Produce a realistic best estimate. Typical home portions unless stated otherwise.',
  '- Account for cooking fats, oils, dressings and sauces that a description implies but does not name.',
  '- State every meaningful assumption you made, briefly and concretely.',
  '- Set confidence honestly. Use "low" when portion sizes are unknown or the photo is ambiguous;',
  '  "high" only when quantities are explicit (weights, counts, or standard packaged items).',
  '- Keep calories roughly consistent with the macros you give (protein 4 kcal/g, carbs 4 kcal/g, fat 9 kcal/g).',
  '- This is an estimate for personal tracking, not nutritional or medical advice.',
  '  Do not add disclaimers, warnings or commentary. Only fill in the structured fields.',
  '- If the input does not describe food at all, return a mealName of "Unknown" with zero values,',
  '  low confidence, and an assumption explaining that no meal could be identified.',
].join('\n');

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  if (request.method !== 'POST') {
    return errorResponse(request, 'Method not allowed.', 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const model = Deno.env.get('OPENAI_MACRO_MODEL') ?? DEFAULT_MODEL;

  if (!supabaseUrl || !anonKey) {
    console.error('SUPABASE_URL or SUPABASE_ANON_KEY is not configured');
    return errorResponse(request, 'Estimation is not configured on the server.', 500);
  }
  if (!openaiKey) {
    console.error('OPENAI_API_KEY is not configured');
    return errorResponse(
      request,
      'Macro estimation isn’t set up yet. You can still enter the values yourself.',
      503,
    );
  }

  // ---- Authentication ------------------------------------------------------
  // The platform already rejects unauthenticated calls (verify_jwt), but the
  // user id is needed for rate limiting and is worth confirming directly.
  const authorization = request.headers.get('Authorization');
  if (!authorization) return errorResponse(request, 'Sign in to use this feature.', 401);

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return errorResponse(request, 'Your session has expired. Sign in again.', 401);
  }

  // ---- Throttling ----------------------------------------------------------
  const limit = checkRateLimit(userData.user.id);
  if (!limit.allowed) {
    return jsonResponse(
      request,
      { error: 'You’ve made a lot of estimates just now. Try again shortly.' },
      429,
      { 'Retry-After': String(limit.retryAfterSeconds) },
    );
  }

  // ---- Input ---------------------------------------------------------------
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(request, 'The request body was not valid JSON.', 400);
  }

  const parsedRequest = requestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return errorResponse(
      request,
      parsedRequest.error.issues[0]?.message ?? 'That request could not be understood.',
      400,
    );
  }

  const { description, imageBase64, imageMimeType } = parsedRequest.data;

  if (imageBase64) {
    // base64 inflates by ~4/3; check the decoded size against the same ceiling
    // the storage bucket enforces.
    const approximateBytes = Math.floor((imageBase64.length * 3) / 4);
    if (approximateBytes > MAX_IMAGE_BYTES) {
      return errorResponse(request, 'That image is larger than the 8 MB limit.', 413);
    }
  }

  // ---- Model call ----------------------------------------------------------
  const content: Record<string, unknown>[] = [];
  content.push({
    type: 'input_text',
    text: description?.trim()
      ? `Meal description from the user:\n${description.trim()}`
      : 'The user provided only a photo of the meal, with no description.',
  });
  if (imageBase64 && imageMimeType) {
    content.push({
      type: 'input_image',
      image_url: `data:${imageMimeType};base64,${imageBase64}`,
      detail: 'auto',
    });
  }

  let openaiResponse: Response;
  try {
    openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        instructions: SYSTEM_PROMPT,
        input: [{ role: 'user', content }],
        text: {
          format: {
            type: 'json_schema',
            name: 'macro_estimate',
            strict: true,
            schema: OUTPUT_JSON_SCHEMA,
          },
        },
        max_output_tokens: 1200,
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (cause) {
    console.error('OpenAI request failed', cause);
    return errorResponse(request, 'The estimator did not respond in time. Try again.', 504);
  }

  if (!openaiResponse.ok) {
    const detail = await openaiResponse.text().catch(() => '');
    console.error('OpenAI returned an error', openaiResponse.status, detail.slice(0, 500));

    if (openaiResponse.status === 429) {
      return errorResponse(request, 'The estimator is busy right now. Try again shortly.', 429);
    }
    return errorResponse(
      request,
      'The estimate could not be produced. Enter the values manually for now.',
      502,
    );
  }

  const payload = await openaiResponse.json().catch(() => null);
  const text = extractOutputText(payload);

  if (!text) {
    console.error('No output text in OpenAI response', JSON.stringify(payload)?.slice(0, 500));
    return errorResponse(request, 'The estimator returned nothing usable. Try again.', 502);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch {
    console.error('Model output was not JSON', text.slice(0, 300));
    return errorResponse(request, 'The estimate came back malformed. Try again.', 502);
  }

  const estimate = estimateSchema.safeParse(parsedJson);
  if (!estimate.success) {
    console.error('Model output failed validation', estimate.error.issues.slice(0, 5));
    return errorResponse(
      request,
      'The estimate failed its checks, so it was discarded. Enter the values manually.',
      502,
    );
  }

  return jsonResponse(request, { estimate: estimate.data, model });
});

/** Pulls the assistant's text out of a Responses API payload. */
function extractOutputText(payload: any): string | null {
  if (!payload) return null;
  if (typeof payload.output_text === 'string' && payload.output_text.length > 0) {
    return payload.output_text;
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    const parts = Array.isArray(item?.content) ? item.content : [];
    for (const part of parts) {
      if (typeof part?.text === 'string' && part.text.length > 0) return part.text;
    }
  }

  return null;
}
