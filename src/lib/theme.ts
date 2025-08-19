import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      
      toggleTheme: () => {
        const newMode = !get().isDarkMode;
        set({ isDarkMode: newMode });
        updateDocumentClass(newMode);
      },
      
      setTheme: (isDark: boolean) => {
        set({ isDarkMode: isDark });
        updateDocumentClass(isDark);
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          updateDocumentClass(state.isDarkMode);
        }
      },
    }
  )
);

const updateDocumentClass = (isDark: boolean) => {
  if (typeof document !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

// Initialize theme on load
if (typeof window !== 'undefined') {
  const store = useTheme.getState();
  updateDocumentClass(store.isDarkMode);
}