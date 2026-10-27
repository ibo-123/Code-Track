import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

const THEME_KEY = "codetrack-theme";
const PREFS_KEY = "codetrack-appearance";

export const ACCENT_MAP = {
  blue: { primary: "#3B82F6", soft: "59 130 246", from: "#3B82F6", to: "#2563EB" },
  purple: { primary: "#8B5CF6", soft: "139 92 246", from: "#8B5CF6", to: "#6D28D9" },
  green: { primary: "#22C55E", soft: "34 197 94", from: "#22C55E", to: "#15803D" },
  red: { primary: "#EF4444", soft: "239 68 68", from: "#EF4444", to: "#B91C1C" },
  orange: { primary: "#F97316", soft: "249 115 22", from: "#F97316", to: "#C2410C" },
  pink: { primary: "#EC4899", soft: "236 72 153", from: "#EC4899", to: "#BE185D" },
  indigo: { primary: "#6366F1", soft: "99 102 241", from: "#6366F1", to: "#4338CA" },
  teal: { primary: "#14B8A6", soft: "20 184 166", from: "#14B8A6", to: "#0F766E" },
};

const ACCENT_IDS = Object.freeze(Object.keys(ACCENT_MAP));
const FONT_SIZE_IDS = Object.freeze(["small", "medium", "large", "xl"]);
const PREFERENCE_IDS = Object.freeze(["light", "dark", "system"]);

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

const normalizePrefs = (input = {}) => {
  const preference = PREFERENCE_IDS.includes(input.preference)
    ? input.preference
    : DEFAULT_PREFS.preference;
  const colorScheme = ACCENT_IDS.includes(input.colorScheme)
    ? input.colorScheme
    : DEFAULT_PREFS.colorScheme;
  const fontSize = FONT_SIZE_IDS.includes(input.fontSize)
    ? input.fontSize
    : DEFAULT_PREFS.fontSize;
  return { preference, colorScheme, fontSize };
};

const readPrefs = () => {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) {
      const legacy = localStorage.getItem(THEME_KEY);
      if (legacy === "light" || legacy === "dark") {
        return normalizePrefs({ ...DEFAULT_PREFS, preference: legacy });
      }
      return { ...DEFAULT_PREFS };
    }
    return normalizePrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
  } catch {
    return { ...DEFAULT_PREFS };
  }
};

const applyAccentVars = (root, colorScheme) => {
  const accent = ACCENT_MAP[colorScheme] || ACCENT_MAP.blue;
  // Brand accent (hex) — used by Login, settings preview, chrome gradients
  root.style.setProperty("--accent", accent.primary);
  root.style.setProperty("--accent-rgb", accent.soft);
  root.style.setProperty("--accent-from", accent.from);
  root.style.setProperty("--accent-to", accent.to);
  root.style.setProperty("--accent-bg", `rgb(${accent.soft} / 0.12)`);
  root.style.setProperty("--accent-border", `rgb(${accent.soft} / 0.45)`);
  // Keep a separate muted surface token so Tailwind/shadcn `bg-accent`
  // semantics are not clobbered if those styles are present.
  root.style.setProperty("--brand", accent.primary);
  root.style.setProperty("--brand-rgb", accent.soft);
  root.dataset.accent = colorScheme;
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
    // CSS color-scheme (light/dark UI chrome) — not the accent colorScheme pref
    root.style.colorScheme = theme;
    localStorage.setItem(THEME_KEY, theme);

    applyAccentVars(root, prefs.colorScheme);

    // Scale content via CSS variable — avoid changing html font-size (breaks rem layout)
    const fontSize = FONT_SIZE_MAP[prefs.fontSize] || FONT_SIZE_MAP.medium;
    root.style.setProperty("--app-font-size", fontSize);
    root.dataset.fontSize = prefs.fontSize;

    localStorage.setItem(PREFS_KEY, JSON.stringify(normalizePrefs(prefs)));
  }, [theme, prefs]);

  const updatePrefs = (partial) => {
    setPrefs((prev) => normalizePrefs({ ...prev, ...partial }));
  };

  const setPreference = (preference) => updatePrefs({ preference });
  const setColorScheme = (colorScheme) => {
    if (!ACCENT_IDS.includes(colorScheme)) return;
    updatePrefs({ colorScheme });
  };
  const setFontSize = (fontSize) => updatePrefs({ fontSize });

  const toggleTheme = () => {
    setPreference(theme === "dark" ? "light" : "dark");
  };

  const resetAppearance = () => setPrefs({ ...DEFAULT_PREFS });

  const accent = ACCENT_MAP[prefs.colorScheme] || ACCENT_MAP.blue;

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
      accentHex: accent.primary,
      accentFrom: accent.from,
      accentTo: accent.to,
    }),
    [theme, prefs, accent.primary, accent.from, accent.to]
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
