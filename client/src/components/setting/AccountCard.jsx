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
} from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";

const DEFAULT_USER_DATA = {
  name: "",
  email: "",
  phone: "",
  location: "",
  avatar: "",
};

const normalizeUserData = (data) => ({
  ...DEFAULT_USER_DATA,
  ...(data || {}),
});

function AccountCard({
  userData: initialUserData = DEFAULT_USER_DATA,

  onSave,
  onCancel,
  onEdit,
  onAvatarChange,

  isEditing: externalIsEditing,
  isLoading: externalIsLoading = false,

  className = "",

  editableFields = ["name", "email", "phone", "location"],

  showJoined = true,
  showBio = false,

  avatarColor = "from-blue-400 to-purple-400",

  // Pass complete Tailwind classes instead of dynamically
  // constructing from-${color} classes.
  gradientClass = "from-blue-500 to-purple-500",

  validationRules = {},

  successMessage = "Account updated successfully!",
  errorMessage = "Failed to update account. Please try again.",

  showCancelButton = true,
  cancelButtonText = "Cancel",
  saveButtonText = "Save Changes",
  editButtonText = "Edit",
}) {
  const normalizedInitialData = normalizeUserData(initialUserData);

  const [internalIsEditing, setInternalIsEditing] = useState(false);

  const [userData, setUserData] = useState(normalizedInitialData);

  const [formData, setFormData] = useState(normalizedInitialData);

  const [isSaved, setIsSaved] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [saveError, setSaveError] = useState("");

  const [errors, setErrors] = useState({});

  const [touched, setTouched] = useState({});

  const [avatarPreview, setAvatarPreview] = useState(null);

  const fileInputRef = useRef(null);

  const isEditing =
    externalIsEditing !== undefined
      ? externalIsEditing
      : internalIsEditing;

  const loading = externalIsLoading || isLoading;

  /*
  |--------------------------------------------------------------------------
  | Sync incoming user data
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const safeUserData = normalizeUserData(initialUserData);

    setUserData(safeUserData);
    setFormData(safeUserData);
  }, [initialUserData]);

  /*
  |--------------------------------------------------------------------------
  | Field validation
  |--------------------------------------------------------------------------
  */

  const getFieldLabel = (field) => {
    const labels = {
      name: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      location: "Location",
      joined: "Joined",
      bio: "Bio",
      avatar: "Avatar",
    };

    return labels[field] || field;
  };

  const validateField = (field, value) => {
    const rules = validationRules[field];

    if (!rules) {
      return "";
    }

    const safeValue = String(value ?? "");

    if (rules.required && !safeValue.trim()) {
      return `${getFieldLabel(field)} is required`;
    }

    if (
      field === "email" &&
      rules.pattern &&
      safeValue &&
      !rules.pattern.test(safeValue)
    ) {
      return "Please enter a valid email address";
    }

    if (
      field === "phone" &&
      rules.pattern &&
      safeValue &&
      !rules.pattern.test(safeValue)
    ) {
      return "Please enter a valid phone number";
    }

    if (field === "name") {
      if (
        rules.minLength &&
        safeValue.length < rules.minLength
      ) {
        return `Name must be at least ${rules.minLength} characters`;
      }

      if (
        rules.maxLength &&
        safeValue.length > rules.maxLength
      ) {
        return `Name must be less than ${rules.maxLength} characters`;
      }
    }

    return "";
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(formData).forEach((field) => {
      if (!editableFields.includes(field)) {
        return;
      }

      const error = validateField(field, formData[field]);

      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);

    return isValid;
  };

  /*
  |--------------------------------------------------------------------------
  | Edit
  |--------------------------------------------------------------------------
  */

  const handleEdit = () => {
    console.log("Entering edit mode");
    setFormData({ ...userData });
    setErrors({});
    setTouched({});
    setSaveError("");
    setIsSaved(false);
    setAvatarPreview(null);

    if (externalIsEditing === undefined) {
      setInternalIsEditing(true);
    }

    onEdit?.();
  };

  /*
  |--------------------------------------------------------------------------
  | Cancel
  |--------------------------------------------------------------------------
  */

  const handleCancel = () => {
    setFormData({ ...userData });

    setErrors({});
    setTouched({});
    setSaveError("");
    setIsSaved(false);
    setAvatarPreview(null);

    if (externalIsEditing === undefined) {
      setInternalIsEditing(false);
    }

    onCancel?.();
  };

  /*
  |--------------------------------------------------------------------------
  | Save
  |--------------------------------------------------------------------------
  */

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (typeof onSave !== "function") {
      console.warn(
        "AccountCard: onSave handler was not provided."
      );

      setSaveError(
        "Unable to save changes. Please try again."
      );

      return;
    }

    setIsLoading(true);
    setSaveError("");
    setIsSaved(false);

    try {
      await onSave(formData);

      setUserData({ ...formData });

      if (externalIsEditing === undefined) {
        setInternalIsEditing(false);
      }

      setAvatarPreview(null);
      setIsSaved(true);

      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (error) {
      console.error("Account save error:", error);

      setSaveError(
        error?.response?.data?.message ||
          error?.message ||
          errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Input change
  |--------------------------------------------------------------------------
  */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const error = validateField(name, value);

    setErrors((prev) => {
      const updated = { ...prev };

      if (error) {
        updated[name] = error;
      } else {
        delete updated[name];
      }

      return updated;
    });

    setSaveError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Input blur
  |--------------------------------------------------------------------------
  */

  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const error = validateField(name, value);

    setErrors((prev) => {
      const updated = { ...prev };

      if (error) {
        updated[name] = error;
      } else {
        delete updated[name];
      }

      return updated;
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Avatar
  |--------------------------------------------------------------------------
  */

  const handleAvatarClick = () => {
    if (!loading) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Basic validation
    if (!file.type.startsWith("image/")) {
      setSaveError("Please select a valid image file.");
      return;
    }

    // Optional size validation: 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setSaveError("Image size must be less than 5 MB.");
      return;
    }

    setSaveError("");

    /*
     * Create local preview.
     */
    const reader = new FileReader();

    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };

    reader.readAsDataURL(file);

    /*
     * Keep existing behavior:
     * notify parent about the selected file.
     */
    try {
      if (typeof onAvatarChange === "function") {
        await onAvatarChange(file);
      }
    } catch (error) {
      console.error("Avatar upload error:", error);

      setAvatarPreview(null);

      setSaveError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to upload avatar."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Icons
  |--------------------------------------------------------------------------
  */

  const getFieldIcon = (field) => {
    const icons = {
      name: (
        <User className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
      ),

      email: (
        <Mail className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
      ),

      phone: (
        <Phone className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
      ),

      location: (
        <MapPin className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
      ),

      joined: (
        <Calendar className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
      ),

      bio: (
        <User className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
      ),
    };

    return (
      icons[field] || (
        <User className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
      )
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Editable field
  |--------------------------------------------------------------------------
  */

  const isFieldEditable = (field) => {
    return editableFields.includes(field) && isEditing;
  };

  /*
  |--------------------------------------------------------------------------
  | Input type
  |--------------------------------------------------------------------------
  */

  const getInputType = (field) => {
    switch (field) {
      case "email":
        return "email";

      case "phone":
        return "tel";

      default:
        return "text";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Fields to display
  |--------------------------------------------------------------------------
  |
  | Don't automatically render every property returned by the backend.
  |
  */

  const displayFields = [
    "name",
    "email",
    "phone",
    "location",
  ];

  if (showJoined && Object.prototype.hasOwnProperty.call(userData, "joined")) {
    displayFields.push("joined");
  }

  if (showBio && Object.prototype.hasOwnProperty.call(userData, "bio")) {
    displayFields.push("bio");
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  const avatarSource =
    avatarPreview || userData.avatar || "";

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-shadow duration-300 overflow-hidden ${className}`}
    >
      {/* Card Header */}

      <div
        className={`relative h-24 bg-gradient-to-r ${gradientClass}`}
      >
        <div className="absolute -bottom-12 left-6">
          <div className="relative">

            {/* Avatar */}

            <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
              {avatarSource ? (
                <img
                  src={avatarSource}
                  alt={userData.name || "User avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-br ${avatarColor} flex items-center justify-center`}
                >
                  <span className="text-3xl font-bold text-white">
                    {(userData.name || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Avatar Edit */}

            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={loading}
                  aria-label="Change profile picture"
                  className="absolute bottom-0 right-0 p-1.5 bg-blue-500 rounded-full border-2 border-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}

      <div className="pt-14 px-6 pb-6">

        {/* Header */}

        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              Account Information
            </h3>

            <p className="text-sm text-slate-500">
              {isEditing
                ? "Edit your personal details"
                : "Manage your personal details"}
            </p>
          </div>

          {!isEditing && (
            <button
  type="button"
  onClick={handleEdit}
  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-300 rounded-md bg-white hover:bg-blue-50 hover:border-blue-200 transition-colors"
>
  <Edit2 className="w-4 h-4" />
  {editButtonText}
</button>
          )}
        </div>

        {/* Success */}

        {isSaved && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />

            <p className="text-sm text-green-600 font-medium">
              {successMessage}
            </p>
          </div>
        )}

        {/* Error */}

        {saveError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />

            <p className="text-sm text-red-600 font-medium">
              {saveError}
            </p>
          </div>
        )}

        {/* Account Details */}

        <div className="space-y-4">
          {displayFields.map((field) => {
            const isEditable = isFieldEditable(field);

            const hasError =
              Boolean(errors[field]) &&
              Boolean(touched[field]);

            const value =
              isEditing && isEditable
                ? formData[field] ?? ""
                : userData[field] ?? "";

            return (
              <div
                key={field}
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  isEditing && isEditable
                    ? "hover:bg-blue-50/50"
                    : "hover:bg-slate-50"
                }`}
              >
                {getFieldIcon(field)}

                <div className="flex-1 min-w-0">

                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    {getFieldLabel(field)}

                    {isEditing && isEditable && (
                      <span className="text-red-500 ml-1">
                        *
                      </span>
                    )}
                  </p>

                  {isEditing && isEditable ? (
                    <>
                      <Input
                        name={field}
                        value={value}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`mt-1 ${
                          hasError
                            ? "border-red-300 focus:ring-red-500"
                            : ""
                        }`}
                        placeholder={`Enter your ${getFieldLabel(
                          field
                        ).toLowerCase()}`}
                        type={getInputType(field)}
                        disabled={loading}
                      />

                      {hasError && (
                        <div className="mt-1 flex items-center gap-1 text-red-600 text-xs">
                          <AlertCircle className="w-3.5 h-3.5" />

                          <span>
                            {errors[field]}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm font-medium text-slate-700 mt-1 break-words">
                      {value || "Not provided"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Edit Actions */}

        {isEditing && (
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-3 justify-end">

            {showCancelButton && (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="gap-2"
              >
                <X className="w-4 h-4" />

                {cancelButtonText}
              </Button>
            )}

            <Button
              onClick={handleSave}
              disabled={loading}
              className={`gap-2 bg-gradient-to-r ${gradientClass} hover:opacity-90 disabled:opacity-70`}
            >
              {loading ? (
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
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountCard;