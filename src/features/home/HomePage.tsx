import { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Plus } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Section, SectionHeader } from '@/components/common/section';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDateKey, greetingForTime } from '@/lib/date';
import { initials } from '@/lib/format';
import { listItem, staggerChildren } from '@/lib/motion';
import {
  APPS,
  CATEGORY_LABELS,
  appsInCategory,
  populatedCategories,
  type AppDefinition,
} from '@/app/apps';
import { APP_SURFACES } from '@/app/app-surfaces';
import { useAuth } from '@/features/auth/auth-context';
import { usePreferences, useProfile } from '@/features/settings/hooks';
import { useQuickAdd } from '@/features/quick-add/quick-add-context';

/**
 * The launcher. Everything the app can do is an app you open from here, so this
 * screen stays a grid plus a glance at what's waiting. It never grows a
 * dashboard of its own.
 */
export function HomePage() {
  const { today, timezone } = usePreferences();
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const { open: openQuickAdd } = useQuickAdd();
  const reduceMotion = useReducedMotion();

  const firstName = profile?.display_name?.trim().split(/\s+/)[0];
  const greeting = greetingForTime(new Date(), timezone);

  return (
    <>
      <PageHeader
        title={firstName ? `${greeting}, ${firstName}` : greeting}
        subtitle={<time dateTime={today}>{formatDateKey(today, 'EEEE d MMMM')}</time>}
        action={
          <>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => openQuickAdd()}
              aria-label="Add an entry"
              className="md:hidden"
            >
              <Plus aria-hidden />
            </Button>
            <Link
              to="/settings"
              aria-label="Your account"
              className="grid size-8 place-items-center rounded-full bg-subtle text-xs font-semibold text-subtle-foreground transition-colors hover:bg-border"
            >
              {initials(profile?.display_name) || initials(user?.email) || '·'}
            </Link>
          </>
        }
      />

      <PageBody>
        <SummaryStrip />

        {populatedCategories().map((category) => (
          <Section key={category}>
            <SectionHeader title={CATEGORY_LABELS[category]} />
            <motion.div
              variants={reduceMotion ? undefined : staggerChildren(0.04)}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5"
            >
              {appsInCategory(category).map((app) => (
                <motion.div key={app.id} variants={reduceMotion ? undefined : listItem}>
                  <AppTile app={app} />
                </motion.div>
              ))}
            </motion.div>
          </Section>
        ))}

        <p className="mt-10 text-center text-xs leading-relaxed text-muted-foreground">
          {APPS.length} apps so far. More are on the way. Anything that earns a place in your
          day belongs here.
        </p>
      </PageBody>
    </>
  );
}

/**
 * Each app decides whether it has anything to say right now. When none of them
 * do, `:empty` collapses the row and its spacing along with it.
 */
function SummaryStrip() {
  return (
    <div className="-mx-1 mb-1 flex flex-wrap gap-2 px-1 empty:hidden">
      {APPS.map((app) => {
        const Summary = APP_SURFACES[app.id]?.summary;
        if (!Summary) return null;
        return (
          <Suspense key={app.id} fallback={null}>
            <Summary />
          </Suspense>
        );
      })}
    </div>
  );
}

function AppTile({ app }: { app: AppDefinition }) {
  const Icon = app.icon;

  return (
    <Link
      to={app.path}
      title={app.description}
      className={cn(
        'flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl',
        'border border-border bg-card p-2 text-center shadow-card',
        'transition-[background-color,transform] duration-150 hover:bg-subtle/60 active:scale-[0.96]',
      )}
    >
      <span className="grid size-10 place-items-center rounded-xl bg-subtle">
        <Icon className={cn('size-5', app.tone)} aria-hidden />
      </span>
      <span className="w-full truncate text-xs font-medium">{app.name}</span>
    </Link>
  );
}
