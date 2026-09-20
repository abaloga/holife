import { useNavigate } from 'react-router-dom';
import { Flag } from 'lucide-react';
import { Section, SectionHeader } from '@/components/common/section';
import { EmptyState } from '@/components/common/empty-state';
import { SummaryPill } from '@/components/common/summary-pill';
import { usePreferences } from '@/features/settings/hooks';
import { useGoals } from './hooks';
import { GoalCard } from './components/goal-card';

const FEATURED_LIMIT = 2;

export function GoalsSummary() {
  const { active, isLoading } = useGoals();

  if (isLoading || active.length === 0) return null;

  return (
    <SummaryPill
      to="/goals"
      icon={Flag}
      tone="text-chart-5"
      label={`${active.length} goal${active.length === 1 ? '' : 's'} active`}
    />
  );
}

export function GoalsWidget() {
  const { today } = usePreferences();
  const { active, goals, isLoading } = useGoals();
  const navigate = useNavigate();

  if (isLoading) return null;

  return (
    <Section>
      <SectionHeader
        title="Goals"
        to="/goals"
        meta={active.length > FEATURED_LIMIT ? `${active.length} active` : undefined}
      />
      {active.length === 0 ? (
        <EmptyState
          icon={Flag}
          size="compact"
          title={goals.length === 0 ? 'No goals set' : 'Nothing in progress'}
          description="Name what all of this is actually for."
        />
      ) : (
        <div className="space-y-3">
          {active.slice(0, FEATURED_LIMIT).map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              today={today}
              onSelect={() => navigate('/goals')}
            />
          ))}
        </div>
      )}
    </Section>
  );
}
