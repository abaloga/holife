import * as React from 'react';

/**
 * Add one entry here and one entry in `QUICK_ADD_ACTIONS` to put a new app's
 * add action on the central button.
 */
export type QuickAddAction = 'weight' | 'meal' | 'habit' | 'task';

interface QuickAddContextValue {
  /** `null` = closed. `'menu'` = the picker. Otherwise the open form. */
  view: 'menu' | QuickAddAction | null;
  open: (action?: QuickAddAction) => void;
  close: () => void;
  back: () => void;
}

const QuickAddContext = React.createContext<QuickAddContextValue | null>(null);

export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = React.useState<QuickAddContextValue['view']>(null);

  const value = React.useMemo<QuickAddContextValue>(
    () => ({
      view,
      open: (action) => setView(action ?? 'menu'),
      close: () => setView(null),
      back: () => setView('menu'),
    }),
    [view],
  );

  return <QuickAddContext.Provider value={value}>{children}</QuickAddContext.Provider>;
}

export function useQuickAdd() {
  const context = React.useContext(QuickAddContext);
  if (!context) throw new Error('useQuickAdd must be used inside <QuickAddProvider>');
  return context;
}
