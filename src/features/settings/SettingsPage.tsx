import { useMemo, useState } from 'react';
import { Check, LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { PageBody, PageHeader } from '@/components/layout/page';
import { Section, SectionHeader } from '@/components/common/section';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberField } from '@/components/ui/number-field';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toaster';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { inputClassName } from '@/components/ui/input';
import { cn, round } from '@/lib/utils';
import { toUserMessage } from '@/lib/errors';
import { DAY_NAMES, systemTimezone } from '@/lib/date';
import { displayToKg, kgToDisplay, WEIGHT_UNIT_LABELS } from '@/lib/units';
import { useTheme } from '@/app/theme-provider';
import { useAuth } from '@/features/auth/auth-context';
import { signOut } from '@/features/auth/api';
import { usePreferences, useProfile, useUpdateProfile, useUpdateSettings } from './hooks';
import { SettingRow } from './components/setting-row';
import type { ThemePreference, UnitSystem, WeightUnit } from '@/types/database';

/** The browser knows every zone; asking it beats shipping a list. */
function supportedTimezones(): string[] {
  const withSupport = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
  try {
    const zones = withSupport.supportedValuesOf?.('timeZone');
    if (zones && zones.length > 0) return zones;
  } catch {
    /* Older engines — fall through. */
  }
  return [systemTimezone(), 'UTC'];
}

export function SettingsPage() {
  const { user } = useAuth();
  const { settings, weightUnit, isLoading } = usePreferences();
  const { data: profile } = useProfile();
  const updateSettings = useUpdateSettings();
  const updateProfile = useUpdateProfile();
  const { setPreference } = useTheme();
  const { confirm, confirmElement } = useConfirm();

  const timezones = useMemo(supportedTimezones, []);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [goalWeight, setGoalWeight] = useState<number | null>(null);

  const nameValue = displayName ?? profile?.display_name ?? '';
  const goalWeightValue =
    goalWeight ??
    (settings?.goal_weight_kg != null
      ? round(kgToDisplay(settings.goal_weight_kg, weightUnit), 1)
      : null);

  const patch = async (values: Parameters<typeof updateSettings.mutateAsync>[0]) => {
    try {
      await updateSettings.mutateAsync(values);
    } catch (cause) {
      toast.error(toUserMessage(cause));
    }
  };

  const saveName = async () => {
    const trimmed = nameValue.trim();
    if (trimmed === (profile?.display_name ?? '')) return;
    try {
      await updateProfile.mutateAsync({ display_name: trimmed || null });
      toast.success('Name updated');
    } catch (cause) {
      toast.error(toUserMessage(cause));
    }
  };

  const saveGoalWeight = async (value: number | null) => {
    setGoalWeight(value);
    const kg = value == null ? null : round(displayToKg(value, weightUnit), 3);
    if (kg != null && (kg < 20 || kg > 500)) return;
    await patch({ goal_weight_kg: kg });
  };

  const handleSignOut = () => {
    confirm({
      title: 'Sign out?',
      description: 'Your data stays safe — you can sign back in any time.',
      confirmLabel: 'Sign out',
      onConfirm: async () => {
        try {
          await signOut();
        } catch (cause) {
          toast.error(toUserMessage(cause));
        }
      },
    });
  };

  if (isLoading) return <SettingsSkeleton />;

  if (!settings) {
    return (
      <>
        <PageHeader title="Settings" />
        <PageBody>
          <ErrorState error={null} subject="your settings" />
        </PageBody>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Settings" />

      <PageBody>
        <Section>
          <SectionHeader title="Account" />
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card [&>*+*]:border-t [&>*+*]:border-border">
            <SettingRow label="Display name" htmlFor="setting-name" stacked>
              <Input
                id="setting-name"
                value={nameValue}
                onChange={(event) => setDisplayName(event.target.value)}
                onBlur={saveName}
                placeholder="What should HoLife call you?"
                maxLength={60}
              />
            </SettingRow>
            <SettingRow label="Email" description={user?.email ?? undefined}>
              <span className="text-xs text-muted-foreground">Sign-in address</span>
            </SettingRow>
          </div>
        </Section>

        <Section>
          <SectionHeader title="Appearance" />
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <SettingRow
              label="Theme"
              description="Follows your device unless you choose otherwise."
              stacked
            >
              <SegmentedControl
                value={settings.theme}
                onValueChange={(value: ThemePreference) => {
                  // Apply immediately, then persist — the toggle should not
                  // wait on a round trip.
                  setPreference(value);
                  void patch({ theme: value });
                }}
                aria-label="Theme"
                options={[
                  { value: 'system' as const, label: 'System' },
                  { value: 'light' as const, label: 'Light' },
                  { value: 'dark' as const, label: 'Dark' },
                ]}
              />
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                {settings.theme === 'system' && <Monitor className="size-3.5" aria-hidden />}
                {settings.theme === 'light' && <Sun className="size-3.5" aria-hidden />}
                {settings.theme === 'dark' && <Moon className="size-3.5" aria-hidden />}
                {settings.theme === 'system'
                  ? 'Matching your operating system'
                  : `Always ${settings.theme}`}
              </div>
            </SettingRow>
          </div>
        </Section>

        <Section>
          <SectionHeader title="Units & dates" />
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card [&>*+*]:border-t [&>*+*]:border-border">
            <SettingRow label="Measurement system" stacked>
              <SegmentedControl
                value={settings.unit_system}
                onValueChange={(value: UnitSystem) => void patch({ unit_system: value })}
                aria-label="Measurement system"
                options={[
                  { value: 'metric' as const, label: 'Metric' },
                  { value: 'imperial' as const, label: 'Imperial' },
                ]}
              />
            </SettingRow>

            <SettingRow label="Weight shown in" htmlFor="setting-weight-unit" stacked>
              <select
                id="setting-weight-unit"
                value={settings.weight_unit}
                onChange={(event) =>
                  void patch({ weight_unit: event.target.value as WeightUnit })
                }
                className={cn(inputClassName, 'appearance-none pr-8')}
              >
                {(Object.keys(WEIGHT_UNIT_LABELS) as WeightUnit[]).map((unit) => (
                  <option key={unit} value={unit}>
                    {WEIGHT_UNIT_LABELS[unit]}
                  </option>
                ))}
              </select>
            </SettingRow>

            <SettingRow
              label="Goal weight"
              description="Shows as a reference line on your weight chart."
              htmlFor="setting-goal-weight"
              stacked
            >
              <div className="flex gap-2">
                <NumberField
                  id="setting-goal-weight"
                  value={goalWeightValue}
                  onValueChange={(value) => setGoalWeight(value)}
                  onBlur={() => void saveGoalWeight(goalWeightValue)}
                  suffix={weightUnit === 'st' ? 'st' : weightUnit}
                  step={weightUnit === 'kg' ? 0.5 : 1}
                  decimals={1}
                />
                {settings.goal_weight_kg != null && (
                  <Button
                    type="button"
                    variant="subtle"
                    onClick={() => void saveGoalWeight(null)}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </SettingRow>

            <SettingRow
              label="Timezone"
              description="Decides when your day starts and ends."
              htmlFor="setting-timezone"
              stacked
            >
              <select
                id="setting-timezone"
                value={settings.timezone}
                onChange={(event) => void patch({ timezone: event.target.value })}
                className={cn(inputClassName, 'appearance-none pr-8')}
              >
                {!timezones.includes(settings.timezone) && (
                  <option value={settings.timezone}>{settings.timezone}</option>
                )}
                {timezones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              {settings.timezone !== systemTimezone() && (
                <button
                  type="button"
                  onClick={() => void patch({ timezone: systemTimezone() })}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-accent underline-offset-4 hover:underline"
                >
                  <Check className="size-3.5" aria-hidden />
                  Use this device’s zone ({systemTimezone()})
                </button>
              )}
            </SettingRow>

            <SettingRow label="Week starts on" htmlFor="setting-week-start" stacked>
              <select
                id="setting-week-start"
                value={settings.week_start_day}
                onChange={(event) => void patch({ week_start_day: Number(event.target.value) })}
                className={cn(inputClassName, 'appearance-none pr-8')}
              >
                {DAY_NAMES.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </select>
            </SettingRow>
          </div>
        </Section>

        <Section>
          <Button variant="outline" block onClick={handleSignOut}>
            <LogOut aria-hidden />
            Sign out
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            HoLife · your data is yours
          </p>
        </Section>
      </PageBody>

      {confirmElement}
    </>
  );
}

function SettingsSkeleton() {
  return (
    <>
      <PageHeader title="Settings" />
      <PageBody>
        <div className="mt-2 space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </PageBody>
    </>
  );
}
