import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

/**
 * Client-only UI state. Server data lives in TanStack Query, filters live in the
 * URL — this store is just for preferences and transient chrome.
 */
interface UiState {
  theme: Theme
  setTheme: (t: Theme) => void
  commandOpen: boolean
  setCommandOpen: (open: boolean) => void
  /** Demo-mode network simulation, to show off loading and rollback states. */
  slowNetwork: boolean
  setSlowNetwork: (v: boolean) => void
  failureRate: number
  setFailureRate: (v: number) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      commandOpen: false,
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      slowNetwork: true,
      setSlowNetwork: (slowNetwork) => set({ slowNetwork }),
      failureRate: 0,
      setFailureRate: (failureRate) => set({ failureRate }),
    }),
    {
      name: 'pipeline:ui',
      partialize: ({ theme, slowNetwork, failureRate }) => ({ theme, slowNetwork, failureRate }),
    },
  ),
)
