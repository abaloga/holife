import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { RequireAuth, Splash } from '@/features/auth/require-auth';
import { AuthPage } from '@/features/auth/AuthPage';
import { HomePage } from '@/features/home/HomePage';
import { PageBody, PageHeader } from '@/components/layout/page';
import { SkeletonRows } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

// Home ships in the main bundle because it is the landing screen. Every app is
// split, and the service worker precaches the chunks so opening one while
// offline still works.
const TodayPage = lazy(() =>
  import('@/features/today/TodayPage').then((module) => ({ default: module.TodayPage })),
);
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
const MusicPage = lazy(() =>
  import('@/features/music/MusicPage').then((module) => ({ default: module.MusicPage })),
);
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })),
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
          That screen doesn’t exist. It may have moved.
        </p>
        <Button asChild className="mt-4">
          <Link to="/">Back home</Link>
        </Button>
      </PageBody>
    </>
  );
}

/** Wraps a split app screen so each one doesn't repeat the Suspense boilerplate. */
function AppRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
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
            <Route index element={<HomePage />} />

            <Route
              path="today"
              element={
                <AppRoute>
                  <TodayPage />
                </AppRoute>
              }
            />
            <Route
              path="weight"
              element={
                <AppRoute>
                  <WeightPage />
                </AppRoute>
              }
            />
            <Route
              path="nutrition"
              element={
                <AppRoute>
                  <NutritionPage />
                </AppRoute>
              }
            />
            <Route
              path="habits"
              element={
                <AppRoute>
                  <HabitsPage />
                </AppRoute>
              }
            />
            <Route
              path="tasks"
              element={
                <AppRoute>
                  <TasksPage />
                </AppRoute>
              }
            />
            <Route
              path="goals"
              element={
                <AppRoute>
                  <GoalsPage />
                </AppRoute>
              }
            />
            <Route
              path="music"
              element={
                <AppRoute>
                  <MusicPage />
                </AppRoute>
              }
            />
            <Route
              path="settings"
              element={
                <AppRoute>
                  <SettingsPage />
                </AppRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
