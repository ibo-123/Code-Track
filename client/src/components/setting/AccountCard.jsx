import { useEffect, useRef, useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  Camera,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
} from "lucide-react";
import { Input } from "../ui/input";

const DEFAULT_USER_DATA = {
  name: "",
  email: "",
  phone: "",
  location: "",
  avatar: "",
  joined: "",
  bio: "",
};

const normalizeUserData = (data) => ({
  ...DEFAULT_USER_DATA,
  ...(data || {}),
});

const formatJoinedDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

function AccountCard({
  userData: initialUserData = DEFAULT_USER_DATA,
  isEditing = false,
  onEdit,
  onCancel,
  onSave,
  onAvatarChange,
  isLoading: externalIsLoading = false,
  className = "",
  editableFields = ["name", "phone", "location", "bio"],
  showJoined = true,
  showBio = true,
  successMessage = "Account updated successfully!",
  errorMessage = "Failed to update account. Please try again.",
}) {
  const [formData, setFormData] = useState(() => normalizeUserData(initialUserData));
  const [displayData, setDisplayData] = useState(() =>
    normalizeUserData(initialUserData)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);
  const fileInputRef = useRef(null);

  const loading = externalIsLoading || isLoading;

  useEffect(() => {
    const safeData = normalizeUserData(initialUserData);
    setDisplayData(safeData);
    setImgFailed(false);
    if (!isEditing) {
      setFormData(safeData);
      setAvatarPreview(null);
      setSelectedFile(null);
    }
  }, [initialUserData, isEditing]);

  const getFieldLabel = (field) =>
    ({
      name: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      location: "Location",
      joined: "Member Since",
      bio: "Bio",
    })[field] || field;

  const validateField = (field, value) => {
    const safeValue = String(value ?? "").trim();
    if (field === "name") {
      if (!safeValue) return "Full name is required";
      if (safeValue.length < 2) return "Name must be at least 2 characters";
      if (safeValue.length > 50) return "Name must be less than 50 characters";
    }
    if (field === "email" && safeValue) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeValue)) {
        return "Please enter a valid email address";
      }
    }
    if (field === "phone" && safeValue) {
      if (!/^[+\d][\d\s()-]{6,19}$/.test(safeValue)) {
        return "Please enter a valid phone number";
      }
    }
    return "";
  };

  const validateForm = () => {
    const newErrors = {};
    editableFields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    setTouched(
      Object.fromEntries(editableFields.map((field) => [field, true]))
    );
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = (e) => {
    e?.preventDefault?.();
    setFormData(normalizeUserData(initialUserData));
    setErrors({});
    setTouched({});
    setSaveError("");
    setIsSaved(false);
    setAvatarPreview(null);
    setSelectedFile(null);
    setImgFailed(false);
    onEdit?.();
  };

  const handleCancel = () => {
    setFormData(normalizeUserData(initialUserData));
    setErrors({});
    setTouched({});
    setSaveError("");
    setAvatarPreview(null);
    setSelectedFile(null);
    setImgFailed(false);
    onCancel?.();
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (typeof onSave !== "function") {
      setSaveError("Unable to save changes. Please try again.");
      return;
    }

    try {
      setIsLoading(true);
      setSaveError("");
      setIsSaved(false);
      await onSave(formData, selectedFile);
      setDisplayData({ ...formData });
      setAvatarPreview(null);
      setSelectedFile(null);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      setSaveError(
        error?.response?.data?.message || error?.message || errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => {
      const next = { ...prev };
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
    setSaveError("");
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSaveError("Please select a valid image file.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSaveError("Image size must be less than 5 MB.");
      e.target.value = "";
      return;
    }

    setSaveError("");
    setSelectedFile(file);
    setImgFailed(false);

    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);

    try {
      await onAvatarChange?.(file);
    } catch (error) {
      setAvatarPreview(null);
      setSelectedFile(null);
      setSaveError(error?.message || "Failed to process avatar.");
    }
  };

  const fieldMeta = {
    name: { icon: User, tone: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" },
    email: { icon: Mail, tone: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10" },
    phone: { icon: Phone, tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" },
    location: { icon: MapPin, tone: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10" },
    joined: { icon: Calendar, tone: "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800" },
    bio: { icon: FileText, tone: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10" },
  };

  const displayFields = ["name", "email", "phone", "location"];
  if (showJoined) displayFields.push("joined");
  if (showBio) displayFields.push("bio");

  const avatarSource = avatarPreview || displayData.avatar || "";
  const showImage = Boolean(avatarSource) && !imgFailed;

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${className}`}
    >
      {/* Banner */}
      <div className="relative h-28 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_0%,#93c5fd,transparent_35%)]" />
        <div className="absolute -bottom-12 left-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-lg ring-1 ring-black/5">
              {showImage ? (
                <img
                  src={avatarSource}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white tracking-wide">
                    {getInitials(displayData.name)}
                  </span>
                </div>
              )}
            </div>

            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="absolute bottom-1 right-1 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900 shadow-md disabled:opacity-50 transition-colors"
                  title="Change photo"
                  aria-label="Change profile photo"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="pt-16 px-6 pb-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              Account Information
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isEditing
                ? "Update your personal details below"
                : "Manage your personal details"}
            </p>
            {displayData.name && (
              <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                {displayData.name}
              </p>
            )}
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg
                bg-slate-900 text-white hover:bg-slate-800
                dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100
                shadow-sm transition-colors flex-shrink-0"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        {isSaved && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
              {successMessage}
            </p>
          </div>
        )}
        {saveError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
              {saveError}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayFields.map((field) => {
            const meta = fieldMeta[field] || fieldMeta.name;
            const Icon = meta.icon;
            const isJoined = field === "joined";
            const isEmail = field === "email";
            const editable =
              editableFields.includes(field) && isEditing && !isJoined && !isEmail;
            const rawValue = editable
              ? formData[field] ?? ""
              : displayData[field] ?? "";
            const value = isJoined ? formatJoinedDate(rawValue) : rawValue;
            const hasError = Boolean(errors[field] && touched[field]);
            const spanFull = field === "bio";

            return (
              <div
                key={field}
                className={`flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 ${
                  spanFull ? "sm:col-span-2" : ""
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.tone}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {getFieldLabel(field)}
                    {editable && <span className="text-red-500 ml-0.5">*</span>}
                  </p>

                  {editable ? (
                    field === "bio" ? (
                      <textarea
                        name={field}
                        value={value}
                        onChange={handleChange}
                        disabled={loading}
                        rows={3}
                        placeholder="Tell us a bit about yourself"
                        className={`mt-1.5 w-full rounded-lg border bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                          hasError
                            ? "border-red-300 dark:border-red-500/50"
                            : "border-slate-200 dark:border-slate-700"
                        }`}
                      />
                    ) : (
                      <Input
                        type={field === "phone" ? "tel" : "text"}
                        name={field}
                        value={value}
                        onChange={handleChange}
                        disabled={loading}
                        className={`mt-1.5 h-10 bg-white dark:bg-slate-900 ${
                          hasError ? "border-red-300 dark:border-red-500/50" : ""
                        }`}
                        placeholder={`Enter your ${getFieldLabel(field).toLowerCase()}`}
                      />
                    )
                  ) : (
                    <p
                      className={`mt-1 text-sm font-medium break-words ${
                        value
                          ? "text-slate-800 dark:text-slate-100"
                          : "text-slate-400 dark:text-slate-500 italic"
                      }`}
                    >
                      {value || "Not provided"}
                    </p>
                  )}

                  {isEmail && isEditing && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      Email can’t be changed here for security.
                    </p>
                  )}

                  {hasError && (
                    <div className="mt-1.5 flex items-center gap-1 text-red-600 dark:text-red-400 text-xs">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors[field]}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {isEditing && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-95 shadow-sm disabled:opacity-60 transition-opacity"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountCard;
