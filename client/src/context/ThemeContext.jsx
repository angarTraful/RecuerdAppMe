import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return '212, 175, 55';
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return '212, 175, 55';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState({
    preset: 'elegant-gold',
    primaryColor: '#D4AF37',
    secondaryColor: '#E8D5B5',
    backgroundColor: '#0E1116',
    cardBackground: 'rgba(24, 28, 36, 0.85)',
    textColor: '#F8F9FA',
    accentColor: '#F59E0B',
    fontFamily: "'Playfair Display', serif",
    headingFont: "'Cinzel', serif",
    borderRadius: '16px',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
    overlayOpacity: 0.65
  });

  const applyTheme = (newTheme) => {
    if (!newTheme) return;
    setTheme((prev) => ({ ...prev, ...newTheme }));
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primaryColor || '#D4AF37');
    root.style.setProperty('--primary-rgb', hexToRgb(theme.primaryColor));
    root.style.setProperty('--theme-secondary', theme.secondaryColor || '#E8D5B5');
    root.style.setProperty('--theme-bg', theme.backgroundColor || '#0E1116');
    root.style.setProperty('--theme-card-bg', theme.cardBackground || 'rgba(24, 28, 36, 0.85)');
    root.style.setProperty('--theme-text', theme.textColor || '#F8F9FA');
    root.style.setProperty('--theme-accent', theme.accentColor || '#F59E0B');
    root.style.setProperty('--theme-font', theme.fontFamily || "'Playfair Display', serif");
    root.style.setProperty('--theme-heading-font', theme.headingFont || "'Cinzel', serif");
    root.style.setProperty('--theme-radius', theme.borderRadius || '16px');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
