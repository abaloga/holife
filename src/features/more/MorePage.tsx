import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Section, SectionHeader } from '@/components/common/section';
import { Wordmark } from '@/components/common/wordmark';
import { MODULES } from '@/app/modules';
import { initials } from '@/lib/format';
import { useAuth } from '@/features/auth/auth-context';
import { useProfile } from '@/features/settings/hooks';

/**
 * The phone-only overflow screen. On wider layouts every one of these lives in
 * the sidebar, so this route is mostly a tab-bar affordance.
 */
export function MorePage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const trackables = MODULES.filter(
    (module) => module.section === 'track' || module.section === 'plan',
  );
  const system = MODULES.filter((module) => module.section === 'system');

  return (
    <>
      <PageHeader title="More" />

      <PageBody>
        <Link
          to="/settings"
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:bg-subtle/50 active:scale-[0.99]"
        >
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-sm font-semibold text-subtle-foreground"
          >
            {initials(profile?.display_name) || initials(user?.email) || '·'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.9375rem] font-medium">
              {profile?.display_name?.trim() || 'Your account'}
            </span>
            <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </Link>

        <Section>
          <SectionHeader title="Modules" />
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card [&>*+*]:border-t [&>*+*]:border-border">
            {trackables.map((module) => (
              <ModuleLink key={module.id} module={module} />
            ))}
          </div>
        </Section>

        <Section>
          <SectionHeader title="App" />
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card [&>*+*]:border-t [&>*+*]:border-border">
            {system.map((module) => (
              <ModuleLink key={module.id} module={module} />
            ))}
          </div>
        </Section>

        <div className="mt-10 flex flex-col items-center gap-1 text-center">
          <Wordmark />
          <p className="text-xs text-muted-foreground">
            More modules are on the way — workouts, sleep, measurements and more.
          </p>
        </div>
      </PageBody>
    </>
  );
}

function ModuleLink({ module }: { module: (typeof MODULES)[number] }) {
  const Icon = module.icon;

  return (
    <Link
      to={module.path}
      className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-subtle/60"
    >
      <Icon className="size-[1.125rem] shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] font-medium">{module.label}</span>
        <span className="block truncate text-xs text-muted-foreground">{module.description}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}
