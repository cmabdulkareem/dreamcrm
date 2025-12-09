import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import { generatePalette } from '../utils/themeUtils';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { selectedBrand } = useContext(AuthContext);
  const [currentThemeColor, setCurrentThemeColor] = useState('#ED1164'); // Default Hot Pink
  const [theme, setTheme] = useState(localStorage.getItem("color-theme") || "light");

  useEffect(() => {
    const className = "dark";
    const bodyClass = window.document.body.classList;

    if (theme === "dark") {
      bodyClass.add(className);
      document.documentElement.classList.add(className);
    } else {
      bodyClass.remove(className);
      document.documentElement.classList.remove(className);
    }

    localStorage.setItem("color-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    // Determine the theme color
    // If a brand is selected and has a themeColor, use it.
    // Otherwise, fallback to default.
    const newColor = selectedBrand?.themeColor || '#ED1164';
    setCurrentThemeColor(newColor);

    // Generate palette
    const palette = generatePalette(newColor);

    // Apply CSS variables to root
    const root = document.documentElement;

    // Map palette to CSS variables matching tailwind config in index.css
    // We used --color-brand-* in index.css
    Object.keys(palette).forEach(shade => {
      root.style.setProperty(`--color-brand-${shade}`, palette[shade]);
    });

    // Also set the theme-pink-500 var if it's being used as a reference
    root.style.setProperty('--color-theme-pink-500', newColor);

  }, [selectedBrand]);

  return (
    <ThemeContext.Provider value={{ currentThemeColor, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
