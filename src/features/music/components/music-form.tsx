import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { ControlledNumber, ControlledSegmented } from '@/components/form/controlled';
import { toast } from '@/components/ui/toaster';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { toUserMessage } from '@/lib/errors';
import { musicFormSchema, type MusicFormValues } from '../schema';
import { useCreateMusicItem, useDeleteMusicItem, useUpdateMusicItem } from '../hooks';
import type { MusicItem } from '../api';

const FORMAT_OPTIONS = [
  { value: 'cd' as const, label: 'CD' },
  { value: 'cassette' as const, label: 'Cassette' },
];

export function MusicForm({ item, onDone }: { item?: MusicItem; onDone: () => void }) {
  const create = useCreateMusicItem();
  const update = useUpdateMusicItem();
  const remove = useDeleteMusicItem();
  const { confirm, confirmElement } = useConfirm();

  const form = useForm<MusicFormValues>({
    resolver: zodResolver(musicFormSchema),
    defaultValues: {
      title: item?.title ?? '',
      artist: item?.artist ?? '',
      format: item?.format ?? 'cd',
      releaseYear: item?.release_year ?? null,
      notes: item?.notes ?? '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const input = {
      title: values.title,
      artist: values.artist,
      format: values.format,
      releaseYear: values.releaseYear,
      notes: values.notes,
    };

    try {
      if (item) {
        await update.mutateAsync({ id: item.id, ...input });
        toast.success('Release updated');
      } else {
        await create.mutateAsync(input);
        toast.success('Added to your collection');
      }
      onDone();
    } catch (cause) {
      form.setError('root', { message: toUserMessage(cause) });
    }
  });

  const handleDelete = () => {
    if (!item) return;
    confirm({
      title: 'Remove this release?',
      description: 'This cannot be undone.',
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        try {
          await remove.mutateAsync(item.id);
          toast.success('Removed from your collection');
          onDone();
        } catch (cause) {
          toast.error(toUserMessage(cause));
        }
      },
    });
  };

  const errors = form.formState.errors;

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-1" noValidate>
      <Field label="Format" error={errors.format?.message}>
        <ControlledSegmented
          control={form.control}
          name="format"
          options={FORMAT_OPTIONS}
          aria-label="Format"
        />
      </Field>

      <Field label="Title" htmlFor="music-title" error={errors.title?.message ?? errors.root?.message}>
        <Input
          id="music-title"
          placeholder="Rumours"
          maxLength={200}
          autoFocus={!item}
          aria-invalid={Boolean(errors.title)}
          {...form.register('title')}
        />
      </Field>

      <Field label="Artist" htmlFor="music-artist" aside="Optional" error={errors.artist?.message}>
        <Input
          id="music-artist"
          placeholder="Fleetwood Mac"
          maxLength={200}
          {...form.register('artist')}
        />
      </Field>

      <Field label="Year" htmlFor="music-year" aside="Optional" error={errors.releaseYear?.message}>
        <ControlledNumber
          control={form.control}
          name="releaseYear"
          id="music-year"
          placeholder="1977"
          decimals={0}
          inputMode="numeric"
        />
      </Field>

      <Field label="Notes" htmlFor="music-notes" aside="Optional" error={errors.notes?.message}>
        <Textarea
          id="music-notes"
          rows={2}
          maxLength={1000}
          placeholder="Pressing, condition, where you found it"
          {...form.register('notes')}
        />
      </Field>

      <div className="flex items-center gap-2 pt-1">
        {item && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            aria-label="Remove from collection"
          >
            <Trash2 aria-hidden />
          </Button>
        )}
        <Button type="submit" block loading={form.formState.isSubmitting}>
          {item ? 'Save' : 'Add to collection'}
        </Button>
      </div>

      {confirmElement}
    </form>
  );
}
