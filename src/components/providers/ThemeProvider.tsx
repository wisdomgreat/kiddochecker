
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ThemeSettings } from "@/types/supabase";

interface ThemeContextType {
  settings: ThemeSettings;
  updateTheme: (settings: ThemeSettings) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [settings, setSettings] = useState<ThemeSettings>({
    theme: "light",
    colorScheme: "purple",
    highContrast: false,
    largeText: false,
    animations: true,
  });

  // Load theme settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("themeSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings) as ThemeSettings;
        setSettings(parsed);
        applyThemeSettings(parsed);
      } catch (error) {
        console.error("Error parsing saved theme settings:", error);
      }
    } else {
      applyThemeSettings(settings);
    }
  }, []);

  const applyThemeSettings = (themeSettings: ThemeSettings) => {
    const root = document.documentElement;
    const body = document.body;

    // Apply theme
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (themeSettings.theme === "dark" || (themeSettings.theme === "system" && prefersDark)) {
      root.classList.add("dark");
      body.classList.add("dark");
    } else {
      root.classList.remove("dark");
      body.classList.remove("dark");
    }

    // Apply color scheme
    const colorMap: Record<string, { primary: string; hsl: string }> = {
      purple: { primary: "#8B5CF6", hsl: "252 95% 70%" },
      blue: { primary: "#3b82f6", hsl: "220 91% 60%" },
      green: { primary: "#22c55e", hsl: "142 71% 45%" },
      orange: { primary: "#f97316", hsl: "25 95% 53%" },
    };

    const colorConfig = colorMap[themeSettings.colorScheme];
    if (colorConfig) {
      root.style.setProperty("--color-primary", colorConfig.primary);
      root.style.setProperty("--primary", colorConfig.hsl);
    }

    // Apply accessibility settings
    if (themeSettings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    if (themeSettings.largeText) {
      root.classList.add("large-text");
    } else {
      root.classList.remove("large-text");
    }

    if (!themeSettings.animations) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }
  };

  const updateTheme = (newSettings: ThemeSettings) => {
    setSettings(newSettings);
    localStorage.setItem("themeSettings", JSON.stringify(newSettings));
    applyThemeSettings(newSettings);
  };

  return (
    <ThemeContext.Provider value={{ settings, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

