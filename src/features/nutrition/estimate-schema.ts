import { z } from 'zod';

/**
 * The contract with the `estimate-macros` Edge Function.
 *
 * This is the strictest boundary in the app: the values originate from a
 * language model, so nothing reaches application state until it has been
 * parsed here. The same shape is enforced again server-side before the
 * function responds.
 */

export const estimateConfidenceSchema = z.enum(['low', 'medium', 'high']);

export const macroEstimateSchema = z.object({
  mealName: z.string().trim().min(1).max(160),
  calories: z.number().finite().min(0).max(20000),
  proteinGrams: z.number().finite().min(0).max(2000),
  carbohydrateGrams: z.number().finite().min(0).max(2000),
  fatGrams: z.number().finite().min(0).max(2000),
  confidence: estimateConfidenceSchema,
  /** Short, concrete statements about what was assumed — portion sizes, oils. */
  assumptions: z.array(z.string().trim().min(1).max(240)).max(8).default([]),
  /** Optional breakdown, shown so the user can see what was actually counted. */
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

export const estimateResponseSchema = z.object({
  estimate: macroEstimateSchema,
  /** Which model produced this, recorded on the saved meal for traceability. */
  model: z.string().min(1).max(120),
});

export type MacroEstimate = z.infer<typeof macroEstimateSchema>;
export type EstimateResponse = z.infer<typeof estimateResponseSchema>;

/** Maximum image size accepted by the estimator and the storage bucket. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

export function isAcceptedImageType(value: string): value is AcceptedImageType {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(value);
}

export const estimateRequestSchema = z.object({
  description: z
    .string()
    .trim()
    .max(1500, 'Keep the description under 1500 characters')
    .optional(),
  /** Base64 data URL of the photo, when one was attached. */
  imageBase64: z.string().max(12_000_000).optional(),
  imageMimeType: z.enum(ACCEPTED_IMAGE_TYPES).optional(),
});

export type EstimateRequest = z.infer<typeof estimateRequestSchema>;
