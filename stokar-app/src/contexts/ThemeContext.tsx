import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider as StyledProvider } from 'styled-components/native';
import { themes, type AppTheme, type ThemeMode } from '@/styles/themes';

/** 'system' acompanha o modo claro/escuro do aparelho. */
export type ThemePreference = 'system' | ThemeMode;

interface ThemeContextValue {
  preference: ThemePreference;
  mode: ThemeMode;
  theme: AppTheme;
  setPreference: (preference: ThemePreference) => void;
}

const STORAGE_KEY = 'stokar.theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') setPreferenceState(saved);
      })
      .catch(() => {
        /* sem preferência salva: segue o aparelho */
      });
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const mode: ThemeMode = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const value = useMemo(
    () => ({ preference, mode, theme: themes[mode], setPreference }),
    [preference, mode, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StyledProvider theme={value.theme}>{children}</StyledProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeMode precisa estar dentro de <ThemeProvider>');
  return context;
}
