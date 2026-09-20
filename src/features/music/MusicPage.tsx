import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Disc3, Plus } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/layout/page';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { ListGroup, ListRow } from '@/components/common/list-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { SkeletonRows } from '@/components/ui/skeleton';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { listItem, staggerChildren } from '@/lib/motion';
import { useMusicCollection } from './hooks';
import { MusicForm } from './components/music-form';
import type { MusicItem } from './api';

type Filter = 'all' | 'cd' | 'cassette';

const FORMAT_LABELS: Record<MusicItem['format'], string> = {
  cd: 'CD',
  cassette: 'Cassette',
};

export function MusicPage() {
  const { items, cds, cassettes, isLoading, isError, error, refetch } = useMusicCollection();
  const reduceMotion = useReducedMotion();

  const [filter, setFilter] = useState<Filter>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<MusicItem | null>(null);

  const visible = filter === 'all' ? items : items.filter((item) => item.format === filter);

  return (
    <>
      <PageHeader
        title="Music"
        back="/"
        subtitle={
          items.length > 0
            ? `${cds.length} ${cds.length === 1 ? 'CD' : 'CDs'}, ${cassettes.length} ${
                cassettes.length === 1 ? 'cassette' : 'cassettes'
              }`
            : undefined
        }
        action={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus aria-hidden />
            Add
          </Button>
        }
      >
        {items.length > 0 && (
          <SegmentedControl
            value={filter}
            onValueChange={setFilter}
            aria-label="Format filter"
            options={[
              { value: 'all', label: 'All', badge: items.length },
              { value: 'cd', label: 'CDs', badge: cds.length },
              { value: 'cassette', label: 'Cassettes', badge: cassettes.length },
            ]}
          />
        )}
      </PageHeader>

      <PageBody>
        {isLoading && <SkeletonRows rows={5} className="mt-4" />}

        {!isLoading && isError && (
          <ErrorState error={error} subject="your collection" onRetry={refetch} />
        )}

        {!isLoading && !isError && items.length === 0 && (
          <EmptyState
            icon={Disc3}
            title="Nothing in your collection yet"
            description="Add the first CD or cassette you own and the shelf builds itself from there."
            action={{ label: 'Add a release', onClick: () => setAddOpen(true) }}
            className="mt-6"
          />
        )}

        {!isLoading && !isError && items.length > 0 && visible.length === 0 && (
          <EmptyState
            icon={Disc3}
            size="compact"
            title={`No ${filter === 'cd' ? 'CDs' : 'cassettes'} yet`}
            description="Everything you own is under the other tab."
            className="mt-6"
          />
        )}

        {!isLoading && !isError && visible.length > 0 && (
          <motion.div
            variants={reduceMotion ? undefined : staggerChildren()}
            initial="hidden"
            animate="visible"
            className="mt-4"
          >
            <ListGroup>
              {visible.map((item) => (
                <motion.div key={item.id} variants={reduceMotion ? undefined : listItem}>
                  <ListRow
                    onActivate={() => setEditing(item)}
                    activateLabel={`Edit ${item.title}`}
                    trailing={
                      <Badge variant="outline" className="shrink-0">
                        {FORMAT_LABELS[item.format]}
                      </Badge>
                    }
                  >
                    <span className="block truncate text-[0.9375rem] font-medium">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {[item.artist, item.release_year].filter(Boolean).join(' · ') ||
                        'No artist recorded'}
                    </span>
                  </ListRow>
                </motion.div>
              ))}
            </ListGroup>
          </motion.div>
        )}
      </PageBody>

      <Sheet open={addOpen} onOpenChange={setAddOpen} title="Add to collection">
        <MusicForm onDone={() => setAddOpen(false)} />
      </Sheet>

      <Sheet
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edit release"
      >
        {editing && <MusicForm item={editing} onDone={() => setEditing(null)} />}
      </Sheet>
    </>
  );
}
