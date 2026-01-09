
import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useAuth();

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Default settings
    const theme = userProfile?.settings?.theme || 'system';
    const compact = userProfile?.settings?.accessibility?.compactMode || false;
    const fontSize = userProfile?.settings?.accessibility?.fontSize || 'medium';
    const highContrast = userProfile?.settings?.accessibility?.highContrast || false;
    const reduceMotion = userProfile?.settings?.accessibility?.reduceMotion || false;

    // --- 1. Theme Application Logic ---
    const applyTheme = () => {
      // Remove existing classes first to prevent conflicts
      root.classList.remove('light', 'dark');
      
      let effectiveTheme = theme;
      if (theme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        effectiveTheme = systemDark ? 'dark' : 'light';
      }
      
      root.classList.add(effectiveTheme);
      root.setAttribute('data-theme', effectiveTheme); // Add data attribute for extra specificity support
    };

    applyTheme(); // Apply immediately

    // Listen for system changes if theme is 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemChange);

    // --- 2. Other Display Settings ---
    
    // Compact Mode
    if (compact) {
      body.classList.add('compact-mode');
    } else {
      body.classList.remove('compact-mode');
    }

    // High Contrast
    if (highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }

    // Reduce Motion
    if (reduceMotion) {
      body.classList.add('reduce-motion');
    } else {
      body.classList.remove('reduce-motion');
    }

    // Font Size
    root.classList.remove('text-small', 'text-medium', 'text-large');
    root.classList.add(`text-${fontSize}`);

    // Cleanup listener
    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
    };

  }, [userProfile]); // Re-run when profile/settings change

  return <ThemeContext.Provider value={{}}>{children}</ThemeContext.Provider>;
};
