import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserId } from '@/features/auth/auth-context';
import { queryKeys } from '@/lib/query-keys';
import {
  createMusicItem,
  deleteMusicItem,
  listMusicItems,
  updateMusicItem,
  type MusicItemInput,
} from './api';

export function useMusicCollection() {
  const userId = useUserId();
  const query = useQuery({
    queryKey: queryKeys.music.list(userId),
    queryFn: () => listMusicItems(userId),
  });

  const items = useMemo(() => query.data ?? [], [query.data]);

  return {
    items,
    cds: items.filter((item) => item.format === 'cd'),
    cassettes: items.filter((item) => item.format === 'cassette'),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

function useInvalidateMusic() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.music.root(userId) }),
    [queryClient, userId],
  );
}

export function useCreateMusicItem() {
  const userId = useUserId();
  const invalidate = useInvalidateMusic();

  return useMutation({
    mutationFn: (input: MusicItemInput) => createMusicItem(userId, input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateMusicItem() {
  const invalidate = useInvalidateMusic();

  return useMutation({
    mutationFn: ({ id, ...input }: MusicItemInput & { id: string }) => updateMusicItem(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteMusicItem() {
  const invalidate = useInvalidateMusic();

  return useMutation({
    mutationFn: (id: string) => deleteMusicItem(id),
    onSuccess: () => invalidate(),
  });
}
