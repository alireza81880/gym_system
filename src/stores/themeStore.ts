import { createStore, useStore } from './createStore';
import { Theme, ThemeKey } from '../types';
import { ThemeEngineService } from '../services/themeEngine';

export interface ThemeState {
  activeThemeKey: ThemeKey;
  theme: Theme;
}

const initialThemeKey = ThemeEngineService.getInitialTheme();
const initialConfig = ThemeEngineService.getTheme(initialThemeKey);
const initialThemeMode: Theme = initialConfig.category === 'dark' || initialConfig.category === 'special' ? 'dark' : 'light';

// Ensure the active theme is applied to DOM root immediately upon evaluation
if (typeof document !== 'undefined') {
  ThemeEngineService.applyTheme(initialThemeKey);
}

export const themeStore = createStore<ThemeState>({
  activeThemeKey: initialThemeKey,
  theme: initialThemeMode,
});

export const themeActions = {
  setThemeKey(key: ThemeKey): void {
    ThemeEngineService.applyTheme(key);
    const config = ThemeEngineService.getTheme(key);
    const mode: Theme = config.category === 'dark' || config.category === 'special' ? 'dark' : 'light';
    themeStore.setState({ activeThemeKey: key, theme: mode });
  },

  setActiveThemeKey(key: ThemeKey): void {
    themeActions.setThemeKey(key);
  },

  setTheme(theme: Theme): void {
    const fallbackKey: ThemeKey = theme === 'dark' ? 'obsidian' : 'pearl';
    themeActions.setThemeKey(fallbackKey);
  },

  toggleTheme(): void {
    const current = themeStore.getState().theme;
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    themeActions.setTheme(next);
  },
};

export function useThemeStore<S = ThemeState>(selector?: (state: ThemeState) => S): S {
  return useStore(themeStore, selector);
}

export function useTheme() {
  const theme = useStore(themeStore, s => s.theme);
  const activeThemeKey = useStore(themeStore, s => s.activeThemeKey);

  return {
    theme,
    activeThemeKey,
    ...themeActions,
  };
}
