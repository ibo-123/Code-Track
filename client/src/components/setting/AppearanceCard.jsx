import { useState, useEffect } from "react";
import { 
  Palette, 
  Monitor, 
  Moon, 
  Sun,
  Check,
  Eye,
  Sparkles,
  RefreshCw,
  Save,
  RotateCcw,
  Loader2
} from "lucide-react";
import { Button } from "../ui/button";

// Default configurations
const defaultThemes = [
  { id: "light", icon: Sun, label: "Light", color: "bg-amber-400", iconColor: "text-white", description: "Light mode" },
  { id: "dark", icon: Moon, label: "Dark", color: "bg-slate-700", iconColor: "text-white", description: "Dark mode" },
  { id: "system", icon: Monitor, label: "System", color: "bg-blue-400", iconColor: "text-white", description: "Follow system" },
];

const defaultColorSchemes = [
  { id: "blue", color: "bg-blue-500", ring: "ring-blue-500", label: "Blue", hex: "#3B82F6" },
  { id: "purple", color: "bg-purple-500", ring: "ring-purple-500", label: "Purple", hex: "#8B5CF6" },
  { id: "green", color: "bg-green-500", ring: "ring-green-500", label: "Green", hex: "#22C55E" },
  { id: "red", color: "bg-red-500", ring: "ring-red-500", label: "Red", hex: "#EF4444" },
  { id: "orange", color: "bg-orange-500", ring: "ring-orange-500", label: "Orange", hex: "#F97316" },
  { id: "pink", color: "bg-pink-500", ring: "ring-pink-500", label: "Pink", hex: "#EC4899" },
  { id: "indigo", color: "bg-indigo-500", ring: "ring-indigo-500", label: "Indigo", hex: "#6366F1" },
  { id: "teal", color: "bg-teal-500", ring: "ring-teal-500", label: "Teal", hex: "#14B8A6" },
];

const defaultFontSizes = [
  { id: "small", label: "Small", value: "14px", description: "Compact", className: "text-sm" },
  { id: "medium", label: "Medium", value: "16px", description: "Default", className: "text-base" },
  { id: "large", label: "Large", value: "18px", description: "Comfortable", className: "text-lg" },
  { id: "xl", label: "XL", value: "20px", description: "Extra large", className: "text-xl" },
];

function AppearanceCard({
  initialData = {
    theme: "light",
    colorScheme: "blue",
    fontSize: "medium"
  },
  onSave,
  onThemeChange,
  onColorSchemeChange,
  onFontSizeChange,
  onReset,
  themes = defaultThemes,
  colorSchemes = defaultColorSchemes,
  fontSizes = defaultFontSizes,
  showPreview = true,
  showLivePreview = true,
  showReset = true,
  showSaveButton = false,
  title = "Appearance",
  subtitle = "Customize your visual preferences",
  className = "",
  previewLabel = "Live Preview",
  saveButtonText = "Save Changes",
  resetButtonText = "Reset to Default",
  isControlled = false,
  isLoading = false,
  isSaving = false
}) {
  const [internalData, setInternalData] = useState(initialData);
  const [hasChanges, setHasChanges] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  
  // Use either controlled or uncontrolled state
  const data = isControlled ? initialData : internalData;
  
  // Check if there are changes
  useEffect(() => {
    if (!isControlled) {
      const hasChanged = 
        internalData.theme !== initialData.theme ||
        internalData.colorScheme !== initialData.colorScheme ||
        internalData.fontSize !== initialData.fontSize;
      setHasChanges(hasChanged);
    }
  }, [internalData, initialData, isControlled]);

  const updateData = (updates) => {
    const newData = { ...data, ...updates };
    
    if (!isControlled) {
      setInternalData(newData);
    }
    
    if (updates.theme !== undefined) onThemeChange?.(updates.theme);
    if (updates.colorScheme !== undefined) onColorSchemeChange?.(updates.colorScheme);
    if (updates.fontSize !== undefined) onFontSizeChange?.(updates.fontSize);
  };

  const handleThemeChange = (themeId) => {
    updateData({ theme: themeId });
  };

  const handleColorSchemeChange = (schemeId) => {
    updateData({ colorScheme: schemeId });
  };

  const handleFontSizeChange = (sizeId) => {
    updateData({ fontSize: sizeId });
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave(data);
    }
  };

  const handleReset = () => {
    if (!isControlled) {
      setInternalData(initialData);
    }
    onReset?.();
  };

  // Get current selections
  const currentTheme = themes.find(t => t.id === data.theme);
  const currentColorScheme = colorSchemes.find(c => c.id === data.colorScheme);
  const currentFontSize = fontSizes.find(f => f.id === data.fontSize);

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-shadow duration-300 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">
              {title}
            </h3>
          </div>
          <p className="text-sm text-slate-500 ml-12">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showLivePreview && (
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-xs font-medium text-purple-600">{previewLabel}</span>
            </div>
          )}
          {hasChanges && !isControlled && (
            <div className="px-2 py-1 bg-amber-50 rounded-full">
              <span className="text-xs font-medium text-amber-600">Unsaved changes</span>
            </div>
          )}
        </div>
      </div>

      {/* Theme Preview Card */}
      {showPreview && (
        <div 
          className="mb-6 p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50 cursor-pointer hover:border-slate-300 transition-colors"
          onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-500">Preview your current theme</p>
            </div>
            <span className="text-xs text-slate-400">
              {isPreviewExpanded ? '▼' : '▶'}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <div className={`w-8 h-8 rounded-full ${data.theme === 'light' ? 'bg-amber-100' : 'bg-slate-700'} border-2 border-white shadow-sm`}></div>
            <div className={`w-8 h-8 rounded-full ${data.theme === 'dark' ? 'bg-blue-100' : 'bg-slate-700'} border-2 border-white shadow-sm`}></div>
            <div className={`w-8 h-8 rounded-full ${currentColorScheme?.color || 'bg-blue-500'} border-2 border-white shadow-sm`}></div>
            <span className="text-xs text-slate-500 ml-2">
              {currentTheme?.label || 'Light'} • {currentColorScheme?.label || 'Blue'}
            </span>
            {currentFontSize && (
              <span className="text-xs text-slate-400 ml-2">
                • {currentFontSize.label}
              </span>
            )}
          </div>
          
          {/* Expanded preview */}
          {isPreviewExpanded && (
            <div className="mt-4 pt-4 border-t border-slate-200/50">
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <div className={`${currentFontSize?.className || ''}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full ${currentColorScheme?.color || 'bg-blue-500'} flex items-center justify-center text-white font-bold`}>
                      A
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Preview Title</p>
                      <p className="text-xs text-slate-500">Preview description text</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className={`px-3 py-1 ${currentColorScheme?.color || 'bg-blue-500'} text-white text-xs rounded-full`}>
                      Tag
                    </div>
                    <div className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                      Demo
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Theme Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Theme Mode
        </label>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ id, icon: Icon, label, color, iconColor = "text-white", description }) => (
            <button
              key={id}
              onClick={() => handleThemeChange(id)}
              className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                data.theme === id
                  ? "border-purple-500 bg-purple-50 shadow-md"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
              title={description}
            >
              <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center transition-transform duration-200 ${
                data.theme === id ? "scale-110" : "scale-100"
              }`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <span className={`text-sm font-medium ${data.theme === id ? "text-purple-700" : "text-slate-600"}`}>
                {label}
              </span>
              {description && (
                <span className="text-[10px] text-slate-400">{description}</span>
              )}
              {data.theme === id && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Color Scheme */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Color Scheme
        </label>
        <div className="flex gap-3 flex-wrap">
          {colorSchemes.map(({ id, color, ring, label, hex }) => (
            <button
              key={id}
              onClick={() => handleColorSchemeChange(id)}
              className="relative group"
              aria-label={label || id}
            >
              <div className={`w-10 h-10 rounded-full ${color} ring-2 ring-offset-2 transition-all duration-200 ${
                data.colorScheme === id ? ring : "ring-transparent hover:ring-slate-300"
              }`} />
              {data.colorScheme === id && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-5 h-5 bg-white rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                    <Check className="w-3 h-3 text-blue-500" />
                  </div>
                </div>
              )}
              {label && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">{label}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Font Size
        </label>
        <div className="grid grid-cols-4 gap-3">
          {fontSizes.map(({ id, label, value, description, className: fontSizeClass }) => (
            <button
              key={id}
              onClick={() => handleFontSizeChange(id)}
              className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                data.fontSize === id
                  ? "border-purple-500 bg-purple-50 shadow-md"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <p className={`text-center text-slate-700 ${fontSizeClass || ''}`}>
                {label}
              </p>
              {description && (
                <p className="text-[10px] text-slate-400 mt-1">
                  {description}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      {(showSaveButton || showReset) && (
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-3">
          {showSaveButton && (
            <Button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="flex-1 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {saveButtonText}
                </>
              )}
            </Button>
          )}
          
          {showReset && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading || isSaving}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              {resetButtonText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default AppearanceCard;