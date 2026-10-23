import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

const THEME_KEY = "codetrack-theme";
const PREFS_KEY = "codetrack-appearance";

const ACCENT_MAP = {
  blue: { primary: "#3B82F6", soft: "59 130 246" },
  purple: { primary: "#8B5CF6", soft: "139 92 246" },
  green: { primary: "#22C55E", soft: "34 197 94" },
  red: { primary: "#EF4444", soft: "239 68 68" },
  orange: { primary: "#F97316", soft: "249 115 22" },
  pink: { primary: "#EC4899", soft: "236 72 153" },
  indigo: { primary: "#6366F1", soft: "99 102 241" },
  teal: { primary: "#14B8A6", soft: "20 184 166" },
};

const FONT_SIZE_MAP = {
  small: "14px",
  medium: "16px",
  large: "18px",
  xl: "20px",
};

const DEFAULT_PREFS = {
  preference: "system", // light | dark | system
  colorScheme: "blue",
  fontSize: "medium",
};

const readPrefs = () => {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) {
      const legacy = localStorage.getItem(THEME_KEY);
      if (legacy === "light" || legacy === "dark") {
        return { ...DEFAULT_PREFS, preference: legacy };
      }
      return { ...DEFAULT_PREFS };
    }
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
};

const resolveTheme = (preference) => {
  if (preference === "light" || preference === "dark") return preference;
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "dark";
};

export function ThemeProvider({ children }) {
  const [prefs, setPrefs] = useState(() => readPrefs());
  const [theme, setTheme] = useState(() => resolveTheme(readPrefs().preference));

  // Resolve light/dark from preference (+ system changes)
  useEffect(() => {
    const apply = () => setTheme(resolveTheme(prefs.preference));
    apply();

    if (prefs.preference !== "system") return undefined;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => apply();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [prefs.preference]);

  // Apply theme + accent + font size to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.style.colorScheme = theme;
    localStorage.setItem(THEME_KEY, theme);

    const accent = ACCENT_MAP[prefs.colorScheme] || ACCENT_MAP.blue;
    root.style.setProperty("--accent", accent.primary);
    root.style.setProperty("--accent-rgb", accent.soft);
    root.dataset.accent = prefs.colorScheme;

    // Scale content via CSS variable — avoid changing html font-size (breaks rem layout)
    const fontSize = FONT_SIZE_MAP[prefs.fontSize] || FONT_SIZE_MAP.medium;
    root.style.setProperty("--app-font-size", fontSize);
    root.dataset.fontSize = prefs.fontSize;

    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [theme, prefs]);

  const updatePrefs = (partial) => {
    setPrefs((prev) => ({ ...prev, ...partial }));
  };

  const setPreference = (preference) => updatePrefs({ preference });
  const setColorScheme = (colorScheme) => updatePrefs({ colorScheme });
  const setFontSize = (fontSize) => updatePrefs({ fontSize });

  const toggleTheme = () => {
    setPreference(theme === "dark" ? "light" : "dark");
  };

  const resetAppearance = () => setPrefs({ ...DEFAULT_PREFS });

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      preference: prefs.preference,
      colorScheme: prefs.colorScheme,
      fontSize: prefs.fontSize,
      prefs,
      setPreference,
      setColorScheme,
      setFontSize,
      updatePrefs,
      toggleTheme,
      setLight: () => setPreference("light"),
      setDark: () => setPreference("dark"),
      setSystem: () => setPreference("system"),
      resetAppearance,
      accentHex: (ACCENT_MAP[prefs.colorScheme] || ACCENT_MAP.blue).primary,
    }),
    [theme, prefs]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
