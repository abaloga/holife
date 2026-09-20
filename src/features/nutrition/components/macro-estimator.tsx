import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ImagePlus, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { transitions } from '@/lib/motion';
import { toUserMessage } from '@/lib/errors';
import { validateImage } from '../api';
import { estimateMacros, fileToBase64 } from '../estimate';
import { isAcceptedImageType, type MacroEstimate } from '../estimate-schema';
import type { EstimateConfidence } from '@/types/database';

interface MacroEstimatorProps {
  /** Seeds the description box from whatever the user already typed as a name. */
  initialDescription?: string;
  onEstimate: (estimate: MacroEstimate, model: string, image: File | null) => void;
  onCancel: () => void;
}

const CONFIDENCE_COPY: Record<EstimateConfidence, string> = {
  low: 'Low confidence — portions are a guess',
  medium: 'Moderate confidence',
  high: 'Reasonable confidence',
};

/**
 * Describe a meal, optionally attach a photo, get a starting point.
 *
 * The result is explicitly a draft: it lands in the normal form fields, which
 * stay editable, and is labelled as an estimate everywhere it appears. Nothing
 * here claims nutritional accuracy.
 */
export function MacroEstimator({ initialDescription, onEstimate, onCancel }: MacroEstimatorProps) {
  const [description, setDescription] = useState(initialDescription ?? '');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const chooseImage = (file: File | undefined) => {
    if (!file) return;
    const problem = validateImage(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setImage(file);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  };

  const clearImage = () => {
    setImage(null);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    if (fileInput.current) fileInput.current.value = '';
  };

  const run = async () => {
    if (!description.trim() && !image) {
      setError('Describe the meal, add a photo, or both.');
      return;
    }

    setPending(true);
    setError(null);

    try {
      const payload =
        image && isAcceptedImageType(image.type)
          ? {
              description: description.trim() || undefined,
              imageBase64: await fileToBase64(image),
              imageMimeType: image.type,
            }
          : { description: description.trim() };

      const { estimate, model } = await estimateMacros(payload);
      onEstimate(estimate, model, image);
    } catch (cause) {
      setError(toUserMessage(cause));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-subtle/50 p-3.5">
      <Field
        label="Describe the meal"
        htmlFor="estimate-description"
        hint="Include portions where you know them — “two eggs, half an avocado, one slice of sourdough”."
        error={error ?? undefined}
      >
        <Textarea
          id="estimate-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Two scrambled eggs cooked in butter, two slices of sourdough, half an avocado and some strawberries."
          rows={3}
          maxLength={1500}
          className="bg-card"
        />
      </Field>

      <div className="flex items-center gap-2">
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          capture="environment"
          className="sr-only"
          onChange={(event) => chooseImage(event.target.files?.[0])}
        />
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Selected meal"
              className="size-16 rounded-lg border border-border object-cover"
            />
            <button
              type="button"
              onClick={clearImage}
              aria-label="Remove photo"
              className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full border border-border bg-popover text-muted-foreground shadow-card"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInput.current?.click()}
          >
            <ImagePlus aria-hidden />
            Add photo
          </Button>
        )}
        <span className="text-xs text-muted-foreground">Optional</span>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="subtle" size="sm" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={run} loading={pending} className="flex-1">
          <Sparkles aria-hidden />
          Estimate macros
        </Button>
      </div>
    </div>
  );
}

/**
 * Shown above the form fields once an estimate has been applied, so the numbers
 * on screen are never mistaken for something measured.
 */
export function EstimateNotice({
  confidence,
  assumptions,
  onDismiss,
  className,
}: {
  confidence: EstimateConfidence;
  assumptions: string[];
  onDismiss?: () => void;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        'rounded-xl border border-accent/30 bg-accent-subtle/60 p-3 text-[0.8125rem]',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-medium">These numbers are an estimate</p>
          <p className="mt-0.5 text-muted-foreground">
            Check them before saving — portion sizes and hidden fats are guesswork.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="accent">{CONFIDENCE_COPY[confidence]}</Badge>
            {assumptions.length > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="text-xs font-medium underline underline-offset-2"
                aria-expanded={expanded}
              >
                {expanded ? 'Hide' : `What it assumed (${assumptions.length})`}
              </button>
            )}
          </div>
          <AnimatePresence initial={false}>
            {expanded && assumptions.length > 0 && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={transitions.soft}
                className="mt-2 space-y-1 overflow-hidden text-xs text-muted-foreground"
              >
                {assumptions.map((assumption) => (
                  <li key={assumption} className="flex gap-1.5">
                    <span aria-hidden>·</span>
                    <span>{assumption}</span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss estimate notice"
            className="-mr-1 -mt-1 grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-subtle"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
