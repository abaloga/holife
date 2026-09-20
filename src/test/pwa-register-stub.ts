/**
 * Stands in for `virtual:pwa-register/react`, which only exists when
 * vite-plugin-pwa is in the pipeline. Tests do not exercise the service worker.
 */
export function useRegisterSW() {
  return {
    needRefresh: [false, () => {}] as [boolean, (value: boolean) => void],
    offlineReady: [false, () => {}] as [boolean, (value: boolean) => void],
    updateServiceWorker: async () => {},
  };
}
