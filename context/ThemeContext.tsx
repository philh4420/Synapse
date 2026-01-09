
import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useAuth();

  useEffect(() => {
    // Default settings if undefined
    const theme = userProfile?.settings?.theme || 'system';
    const compact = userProfile?.settings?.accessibility?.compactMode || false;
    const fontSize = userProfile?.settings?.accessibility?.fontSize || 'medium';
    const highContrast = userProfile?.settings?.accessibility?.highContrast || false;
    const reduceMotion = userProfile?.settings?.accessibility?.reduceMotion || false;

    const root = document.documentElement;
    const body = document.body;

    // 1. Theme Application
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(systemDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }

    // 2. Compact Mode
    if (compact) {
      body.classList.add('compact-mode');
    } else {
      body.classList.remove('compact-mode');
    }

    // 3. High Contrast
    if (highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }

    // 4. Reduce Motion
    if (reduceMotion) {
      body.classList.add('reduce-motion');
    } else {
      body.classList.remove('reduce-motion');
    }

    // 5. Font Size
    root.classList.remove('text-small', 'text-medium', 'text-large');
    root.classList.add(`text-${fontSize}`);

  }, [userProfile]);

  return <ThemeContext.Provider value={{}}>{children}</ThemeContext.Provider>;
};
