import { useQuery } from '@tanstack/react-query';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { createMealImageUrl } from '../api';

interface MealImageProps {
  /** Storage object path. */
  path: string | null;
  /** An object URL for a photo picked but not yet uploaded. Takes precedence. */
  localUrl?: string | null;
  alt?: string;
  className?: string;
}

/**
 * Meal photos live in a private bucket, so they are fetched through short-lived
 * signed URLs rather than being publicly addressable.
 */
export function MealImage({ path, localUrl, alt = 'Meal photo', className }: MealImageProps) {
  const query = useQuery({
    queryKey: ['meal-image', path],
    queryFn: () => createMealImageUrl(path as string),
    enabled: Boolean(path) && !localUrl,
    // Signed URLs last an hour; refresh a little before they expire.
    staleTime: 50 * 60_000,
    gcTime: 55 * 60_000,
    retry: 1,
  });

  const src = localUrl ?? query.data;

  if (!path && !localUrl) return null;

  if (query.isError) {
    return (
      <div
        className={cn(
          'grid place-items-center rounded-lg border border-dashed border-border text-muted-foreground',
          className,
        )}
      >
        <ImageOff className="size-4" aria-hidden />
        <span className="sr-only">Photo unavailable</span>
      </div>
    );
  }

  if (!src) return <Skeleton className={cn('rounded-lg', className)} />;

  return <img src={src} alt={alt} loading="lazy" className={cn('bg-muted', className)} />;
}
