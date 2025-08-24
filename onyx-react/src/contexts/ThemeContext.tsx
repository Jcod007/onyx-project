import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'onyx' | 'auto';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  isOnyx: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('onyx-theme') as Theme;
    return savedTheme || 'light';
  });

  const [isDark, setIsDark] = useState(false);
  const [isOnyx, setIsOnyx] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      let darkMode = false;
      let onyxMode = false;
      
      if (theme === 'dark') {
        darkMode = true;
      } else if (theme === 'onyx') {
        onyxMode = true;
        darkMode = true; // Onyx is also a dark theme variant
      } else if (theme === 'auto') {
        darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      setIsDark(darkMode);
      setIsOnyx(onyxMode);
      
      // Remove all theme classes first
      document.documentElement.classList.remove('dark', 'onyx');
      
      // Add appropriate theme class
      if (onyxMode) {
        document.documentElement.classList.add('onyx');
        // Also add to body for additional styling
        document.body.classList.add('onyx-theme');
      } else if (darkMode) {
        document.documentElement.classList.add('dark');
        document.body.classList.remove('onyx-theme');
      } else {
        document.body.classList.remove('onyx-theme');
      }
    };

    updateTheme();
    
    // Écouter les changements de préférence système
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateTheme);
      
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [theme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('onyx-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, isDark, isOnyx }}>
      {children}
    </ThemeContext.Provider>
  );
};