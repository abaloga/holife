import type { DateKey } from '@/lib/date';

export const PRIORITIES = [
  { value: 0, label: 'None', short: '—' },
  { value: 1, label: 'Low', short: 'Low' },
  { value: 2, label: 'Medium', short: 'Med' },
  { value: 3, label: 'High', short: 'High' },
] as const;

export type PriorityValue = (typeof PRIORITIES)[number]['value'];

export function priorityLabel(value: number): string {
  return PRIORITIES.find((priority) => priority.value === value)?.label ?? 'None';
}

export interface TaskLike {
  id: string;
  title: string;
  due_date: string | null;
  due_time: string | null;
  priority: number;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export type TaskBucket = 'overdue' | 'today' | 'upcoming' | 'someday';

/**
 * Which list a task belongs in. Anything undated is "someday" rather than being
 * pushed into today — an inbox of undated items should not masquerade as work
 * that is due.
 */
export function bucketFor(task: TaskLike, today: DateKey): TaskBucket {
  if (!task.due_date) return 'someday';
  if (task.due_date < today) return 'overdue';
  if (task.due_date === today) return 'today';
  return 'upcoming';
}

/**
 * Sort within a bucket: earliest due date, then time, then higher priority,
 * then the user's manual order. Date before priority because a high-priority
 * task due next week still is not today's problem.
 */
export function compareTasks(a: TaskLike, b: TaskLike): number {
  if (a.due_date !== b.due_date) {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  }

  const aTime = a.due_time ?? '99:99';
  const bTime = b.due_time ?? '99:99';
  if (aTime !== bTime) return aTime.localeCompare(bTime);

  if (a.priority !== b.priority) return b.priority - a.priority;
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  return a.created_at.localeCompare(b.created_at);
}

export interface GroupedTasks<T extends TaskLike = TaskLike> {
  overdue: T[];
  today: T[];
  upcoming: T[];
  someday: T[];
  completed: T[];
  /** Everything still open, for counts and badges. */
  openCount: number;
  /** Open tasks that need attention today: overdue plus due today. */
  dueTodayCount: number;
}

export function groupTasks<T extends TaskLike>(tasks: T[], today: DateKey): GroupedTasks<T> {
  const groups: GroupedTasks<T> = {
    overdue: [],
    today: [],
    upcoming: [],
    someday: [],
    completed: [],
    openCount: 0,
    dueTodayCount: 0,
  };

  for (const task of tasks) {
    if (task.is_completed) {
      groups.completed.push(task);
      continue;
    }
    groups[bucketFor(task, today)].push(task);
    groups.openCount += 1;
  }

  groups.overdue.sort(compareTasks);
  groups.today.sort(compareTasks);
  groups.upcoming.sort(compareTasks);
  groups.someday.sort(compareTasks);
  // Most recently finished first.
  groups.completed.sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''));

  groups.dueTodayCount = groups.overdue.length + groups.today.length;
  return groups;
}
