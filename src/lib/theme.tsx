import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeContextType = {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [primaryColor, setPrimaryColor] = useState('#ffffff'); // Default to white for dark theme

  useEffect(() => {
    // We could load the theme from Firestore here in the future
    // e.g. const themeSettings = await getDoc(...)
    
    // Update CSS variables for Tailwind (e.g. if we map --color-primary in index.css)
    document.documentElement.style.setProperty('--color-primary', primaryColor);
  }, [primaryColor]);

  return (
    <ThemeContext.Provider value={{ primaryColor, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
