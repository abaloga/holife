import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { RequireAuth, Splash } from '@/features/auth/require-auth';
import { AuthPage } from '@/features/auth/AuthPage';
import { TodayPage } from '@/features/today/TodayPage';
import { PageBody, PageHeader } from '@/components/layout/page';
import { SkeletonRows } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

// Today ships in the main bundle because it is the landing screen. The rest
// are split, and the service worker precaches the chunks so navigating while
// offline still works.
const WeightPage = lazy(() =>
  import('@/features/weight/WeightPage').then((module) => ({ default: module.WeightPage })),
);
const NutritionPage = lazy(() =>
  import('@/features/nutrition/NutritionPage').then((module) => ({
    default: module.NutritionPage,
  })),
);
const HabitsPage = lazy(() =>
  import('@/features/habits/HabitsPage').then((module) => ({ default: module.HabitsPage })),
);
const TasksPage = lazy(() =>
  import('@/features/tasks/TasksPage').then((module) => ({ default: module.TasksPage })),
);
const GoalsPage = lazy(() =>
  import('@/features/goals/GoalsPage').then((module) => ({ default: module.GoalsPage })),
);
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })),
);
const MorePage = lazy(() =>
  import('@/features/more/MorePage').then((module) => ({ default: module.MorePage })),
);

function RouteFallback() {
  return (
    <>
      <PageHeader title="Loading" />
      <PageBody>
        <SkeletonRows rows={5} />
      </PageBody>
    </>
  );
}

function NotFound() {
  return (
    <>
      <PageHeader title="Not found" back />
      <PageBody>
        <p className="mt-4 text-sm text-muted-foreground">
          That screen doesn’t exist — it may have moved.
        </p>
        <Button asChild className="mt-4">
          <Link to="/">Back to Today</Link>
        </Button>
      </PageBody>
    </>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter
      // Opt in to the v7 behaviours now so upgrading is not a behaviour change.
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Suspense fallback={<Splash />}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />

          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<TodayPage />} />

            <Route path="track" element={<Navigate to="/track/weight" replace />} />
            <Route
              path="track/weight"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <WeightPage />
                </Suspense>
              }
            />
            <Route
              path="track/nutrition"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <NutritionPage />
                </Suspense>
              }
            />

            <Route path="plan" element={<Navigate to="/plan/habits" replace />} />
            <Route
              path="plan/habits"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <HabitsPage />
                </Suspense>
              }
            />
            <Route
              path="plan/tasks"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <TasksPage />
                </Suspense>
              }
            />
            <Route
              path="plan/goals"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <GoalsPage />
                </Suspense>
              }
            />

            <Route
              path="more"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <MorePage />
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <SettingsPage />
                </Suspense>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
