import { useState } from "react";
import {
  Palette,
  Monitor,
  Moon,
  Sun,
  Check,
  Eye,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { toast } from "sonner";

const THEMES = [
  {
    id: "light",
    icon: Sun,
    label: "Light",
    description: "Bright interface",
    swatch: "bg-amber-400",
  },
  {
    id: "dark",
    icon: Moon,
    label: "Dark",
    description: "Easy on the eyes",
    swatch: "bg-slate-700",
  },
  {
    id: "system",
    icon: Monitor,
    label: "System",
    description: "Match device",
    swatch: "bg-sky-500",
  },
];

const COLOR_SCHEMES = [
  { id: "blue", color: "bg-blue-500", label: "Blue" },
  { id: "purple", color: "bg-purple-500", label: "Purple" },
  { id: "green", color: "bg-green-500", label: "Green" },
  { id: "red", color: "bg-red-500", label: "Red" },
  { id: "orange", color: "bg-orange-500", label: "Orange" },
  { id: "pink", color: "bg-pink-500", label: "Pink" },
  { id: "indigo", color: "bg-indigo-500", label: "Indigo" },
  { id: "teal", color: "bg-teal-500", label: "Teal" },
];

const FONT_SIZES = [
  { id: "small", label: "Small", description: "Compact", sample: "text-sm" },
  { id: "medium", label: "Medium", description: "Default", sample: "text-base" },
  { id: "large", label: "Large", description: "Comfortable", sample: "text-lg" },
  { id: "xl", label: "XL", description: "Extra large", sample: "text-xl" },
];

function AppearanceCard({ className = "" }) {
  const {
    preference,
    colorScheme,
    fontSize,
    theme,
    accentHex,
    setPreference,
    setColorScheme,
    setFontSize,
    resetAppearance,
  } = useTheme();
  const [previewOpen, setPreviewOpen] = useState(true);

  const currentTheme = THEMES.find((t) => t.id === preference) || THEMES[2];
  const currentColor =
    COLOR_SCHEMES.find((c) => c.id === colorScheme) || COLOR_SCHEMES[0];
  const currentFont =
    FONT_SIZES.find((f) => f.id === fontSize) || FONT_SIZES[1];

  const handleReset = () => {
    resetAppearance();
    toast.success("Appearance reset to defaults");
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${className}`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-sm">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Appearance
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Customize your visual preferences
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 text-xs font-medium text-violet-700 dark:text-violet-300">
              <Sparkles className="w-3.5 h-3.5" />
              Live
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Reset to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Live preview */}
        <button
          type="button"
          onClick={() => setPreviewOpen((o) => !o)}
          className="w-full mb-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-left hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Eye className="w-4 h-4" />
              <span className="text-xs font-medium">Preview your current theme</span>
            </div>
            <span className="text-xs text-slate-400">{previewOpen ? "▼" : "▶"}</span>
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span
              className={`w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${
                theme === "light" ? "bg-amber-100" : "bg-slate-800"
              }`}
            />
            <span
              className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"
              style={{ backgroundColor: accentHex }}
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
              {currentTheme.label} · {currentColor.label} · {currentFont.label}
            </span>
          </div>

          {previewOpen && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className={`flex items-center gap-3 ${currentFont.sample}`}>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: accentHex }}
                  >
                    A
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Preview Title
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Changes apply instantly across the app
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <span
                    className="px-2.5 py-1 text-xs text-white rounded-full"
                    style={{ backgroundColor: accentHex }}
                  >
                    Accent
                  </span>
                  <span className="px-2.5 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {theme === "dark" ? "Dark mode" : "Light mode"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </button>

        {/* Theme mode */}
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
            Theme Mode
          </p>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map(({ id, icon: Icon, label, description, swatch }) => {
              const selected = preference === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setPreference(id);
                    toast.success(`Theme set to ${label}`);
                  }}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    selected
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full ${swatch} flex items-center justify-center ${
                      selected ? "scale-110" : ""
                    } transition-transform`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      selected
                        ? "text-violet-700 dark:text-violet-300"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {label}
                  </span>
                  <span className="text-[10px] text-slate-400">{description}</span>
                  {selected && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Color scheme */}
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
            Color Scheme
          </p>
          <div className="flex gap-3 flex-wrap">
            {COLOR_SCHEMES.map(({ id, color, label }) => {
              const selected = colorScheme === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setColorScheme(id);
                    toast.success(`Accent set to ${label}`);
                  }}
                  className="relative group"
                  aria-label={label}
                  title={label}
                >
                  <span
                    className={`block w-10 h-10 rounded-full ${color} ring-2 ring-offset-2 dark:ring-offset-slate-900 transition-all ${
                      selected
                        ? "ring-slate-900 dark:ring-white scale-110"
                        : "ring-transparent hover:ring-slate-300 dark:hover:ring-slate-600"
                    }`}
                  />
                  {selected && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-white dark:bg-slate-900 rounded-full shadow flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </span>
                  )}
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font size */}
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
            Font Size
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FONT_SIZES.map(({ id, label, description, sample }) => {
              const selected = fontSize === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setFontSize(id);
                    toast.success(`Font size set to ${label}`);
                  }}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    selected
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <p
                    className={`text-center font-medium ${sample} ${
                      selected
                        ? "text-violet-700 dark:text-violet-300"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {label}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 text-center">
                    {description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppearanceCard;
