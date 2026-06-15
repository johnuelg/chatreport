import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage for saved preference, default to dark if none found
    const stored = localStorage.getItem("theme") as Theme | null;
    return stored || "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Add transitioning class for smooth animations
    root.classList.add("theme-transitioning");
    
    // Remove both classes first
    root.classList.remove("light", "dark");
    // Add current theme class
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem("theme", theme);
    
    // Remove transitioning class after animation completes
    const timeout = setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
