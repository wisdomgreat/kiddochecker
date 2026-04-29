import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ColorScheme = 'purple' | 'blue' | 'green' | 'orange';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  largeText: boolean;
  setLargeText: (val: boolean) => void;
  animations: boolean;
  setAnimations: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => (localStorage.getItem('colorScheme') as ColorScheme) || 'purple');
  const [highContrast, setHighContrastState] = useState(() => localStorage.getItem('highContrast') === 'true');
  const [largeText, setLargeTextState] = useState(() => localStorage.getItem('largeText') === 'true');
  const [animations, setAnimationsState] = useState(() => localStorage.getItem('animations') !== 'false');

  const applyTheme = (currentTheme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (currentTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(currentTheme);
    }
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('theme', t);
  };

  const setColorScheme = (s: ColorScheme) => {
    setColorSchemeState(s);
    localStorage.setItem('colorScheme', s);
  };

  const setHighContrast = (v: boolean) => {
    setHighContrastState(v);
    localStorage.setItem('highContrast', String(v));
  };

  const setLargeText = (v: boolean) => {
    setLargeTextState(v);
    localStorage.setItem('largeText', String(v));
  };

  const setAnimations = (v: boolean) => {
    setAnimationsState(v);
    localStorage.setItem('animations', String(v));
  };

  useEffect(() => {
    applyTheme(theme);
    
    // Listen for system theme changes if set to system
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme('system');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-color-scheme', colorScheme);
    if (highContrast) root.classList.add('high-contrast');
    else root.classList.remove('high-contrast');
    
    if (largeText) root.classList.add('large-text');
    else root.classList.remove('large-text');

    if (!animations) root.classList.add('reduce-motion');
    else root.classList.remove('reduce-motion');
  }, [colorScheme, highContrast, largeText, animations]);

  return (
    <ThemeContext.Provider value={{ 
      theme, setTheme, 
      colorScheme, setColorScheme, 
      highContrast, setHighContrast, 
      largeText, setLargeText,
      animations, setAnimations
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

