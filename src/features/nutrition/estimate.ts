import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AppError } from '@/lib/errors';
import {
  estimateResponseSchema,
  type EstimateRequest,
  type EstimateResponse,
} from './estimate-schema';

/** Reads a File as bare base64 (no data-URL prefix), which is what the API wants. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new AppError('That image could not be read.'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Calls the `estimate-macros` Edge Function.
 *
 * The OpenAI key lives only in that function's environment; the browser never
 * sees it and cannot choose a model. The response is parsed before it is
 * allowed anywhere near application state.
 */
export async function estimateMacros(request: EstimateRequest): Promise<EstimateResponse> {
  const { data, error } = await supabase.functions.invoke('estimate-macros', {
    body: request,
  });

  if (error) {
    // The function returns a JSON body with a human-readable `error` on failure.
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      const message = body && typeof body.error === 'string' ? body.error : null;
      throw new AppError(message ?? 'The estimate could not be produced. Try again.', error);
    }
    throw new AppError('Couldn’t reach the estimator. Check your connection and try again.', error);
  }

  const parsed = estimateResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError(
      'The estimate came back in an unexpected shape, so it was discarded. Enter the values manually.',
      parsed.error,
    );
  }

  return parsed.data satisfies EstimateResponse;
}
