import { describe, expect, it } from 'vitest';
import { bucketFor, compareTasks, groupTasks, type TaskLike } from './calculations';

const TODAY = '2025-06-10';

function task(overrides: Partial<TaskLike> & { id: string }): TaskLike {
  return {
    title: overrides.id,
    due_date: null,
    due_time: null,
    priority: 0,
    is_completed: false,
    completed_at: null,
    sort_order: 0,
    created_at: '2025-06-01T00:00:00Z',
    ...overrides,
  };
}

describe('bucketFor', () => {
  it('puts undated tasks in someday, not today', () => {
    expect(bucketFor(task({ id: 'a' }), TODAY)).toBe('someday');
  });

  it('separates overdue, today and upcoming', () => {
    expect(bucketFor(task({ id: 'a', due_date: '2025-06-09' }), TODAY)).toBe('overdue');
    expect(bucketFor(task({ id: 'b', due_date: TODAY }), TODAY)).toBe('today');
    expect(bucketFor(task({ id: 'c', due_date: '2025-06-11' }), TODAY)).toBe('upcoming');
  });
});

describe('compareTasks', () => {
  it('sorts by due date first', () => {
    const sorted = [
      task({ id: 'later', due_date: '2025-06-12', priority: 3 }),
      task({ id: 'sooner', due_date: '2025-06-11', priority: 0 }),
    ].sort(compareTasks);

    expect(sorted[0].id).toBe('sooner');
  });

  it('puts undated tasks last', () => {
    const sorted = [
      task({ id: 'undated' }),
      task({ id: 'dated', due_date: '2025-06-30' }),
    ].sort(compareTasks);

    expect(sorted[0].id).toBe('dated');
  });

  it('sorts by time within the same day', () => {
    const sorted = [
      task({ id: 'afternoon', due_date: TODAY, due_time: '15:00' }),
      task({ id: 'morning', due_date: TODAY, due_time: '09:00' }),
      task({ id: 'anytime', due_date: TODAY }),
    ].sort(compareTasks);

    expect(sorted.map((item) => item.id)).toEqual(['morning', 'afternoon', 'anytime']);
  });

  it('falls back to priority when date and time match', () => {
    const sorted = [
      task({ id: 'low', due_date: TODAY, priority: 1 }),
      task({ id: 'high', due_date: TODAY, priority: 3 }),
    ].sort(compareTasks);

    expect(sorted[0].id).toBe('high');
  });

  it('is a stable total order over an equal set', () => {
    const items = [
      task({ id: 'b', created_at: '2025-06-02T00:00:00Z' }),
      task({ id: 'a', created_at: '2025-06-01T00:00:00Z' }),
    ].sort(compareTasks);

    expect(items.map((item) => item.id)).toEqual(['a', 'b']);
  });
});

describe('groupTasks', () => {
  const tasks = [
    task({ id: 'overdue', due_date: '2025-06-08' }),
    task({ id: 'today', due_date: TODAY }),
    task({ id: 'tomorrow', due_date: '2025-06-11' }),
    task({ id: 'someday' }),
    task({
      id: 'done',
      due_date: TODAY,
      is_completed: true,
      completed_at: '2025-06-10T09:00:00Z',
    }),
  ];

  it('places every task in exactly one bucket', () => {
    const groups = groupTasks(tasks, TODAY);

    expect(groups.overdue.map((item) => item.id)).toEqual(['overdue']);
    expect(groups.today.map((item) => item.id)).toEqual(['today']);
    expect(groups.upcoming.map((item) => item.id)).toEqual(['tomorrow']);
    expect(groups.someday.map((item) => item.id)).toEqual(['someday']);
    expect(groups.completed.map((item) => item.id)).toEqual(['done']);
  });

  it('counts open tasks, excluding completed ones', () => {
    const groups = groupTasks(tasks, TODAY);
    expect(groups.openCount).toBe(4);
  });

  it('counts overdue plus today as needing attention', () => {
    const groups = groupTasks(tasks, TODAY);
    expect(groups.dueTodayCount).toBe(2);
  });

  it('lists the most recently completed first', () => {
    const groups = groupTasks(
      [
        task({ id: 'first', is_completed: true, completed_at: '2025-06-10T08:00:00Z' }),
        task({ id: 'second', is_completed: true, completed_at: '2025-06-10T12:00:00Z' }),
      ],
      TODAY,
    );

    expect(groups.completed.map((item) => item.id)).toEqual(['second', 'first']);
  });

  it('handles an empty list', () => {
    const groups = groupTasks([], TODAY);
    expect(groups.openCount).toBe(0);
    expect(groups.dueTodayCount).toBe(0);
    expect(groups.completed).toEqual([]);
  });
});
