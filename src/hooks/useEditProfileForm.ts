import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import { userService } from "../services/userservice";
import type { User as UserType } from "../types";

export interface EditProfileFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  profileImage: string | null;  // null = explicitly removed; "" = never set
  createdAt?: string;
}

export function useEditProfileForm() {
  const { currentUser, updateUser, token, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<EditProfileFormData>({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    address: currentUser?.address || "",
    // Use null when there is no image so we can distinguish "removed" from "not loaded yet"
    profileImage: currentUser?.profileImage ?? null,
    createdAt: currentUser?.createdAt,
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ Update form data when currentUser changes (only for the first load)
  useEffect(() => {
    if (currentUser && !isInitialized) {
      setFormData({
        name: currentUser.name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        address: currentUser.address || "",
        profileImage: currentUser.profileImage ?? null,
        createdAt: currentUser.createdAt,
      });
      setIsInitialized(true);
    }
  }, [currentUser, isInitialized]);

  const [isSaving, setIsSaving] = useState(false);

  const getDashboardPath = () => {
    if (!currentUser) return "/login";

    switch (currentUser.role) {
      case "SELLER":
        return "/seller-dashboard";
      case "ADMIN":
        return "/admin-dashboard";
      default:
        return "/buyer-dashboard";
    }
  };

  const handleInputChange = (field: keyof EditProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileImageChange = (imageUrl: string | undefined) => {
    // Preserve null explicitly: undefined from "Remove" → null (not "") so the
    // backend receives profileImageUrl: null and clears the field.
    setFormData((prev) => ({ ...prev, profileImage: imageUrl ?? null }));
  };

  const handleCancel = () => {
    navigate(getDashboardPath());
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("You need to be logged in to update your profile");
      navigate("/login");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!token) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    // Phone validation (optional but must match format if provided)
    if (formData.phone.trim()) {
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        toast.error("Please enter a valid phone number");
        return;
      }
    }

    setIsSaving(true);

    try {
      // profileImage: null means the user explicitly removed it → send null to backend
      // profileImage: "" means it was never set → also send null
      const profileImageUrl: string | null =
        formData.profileImage?.trim() || null;

      console.log('[DEBUG] Sending profileImageUrl to backend:', profileImageUrl);

      const response = await userService.updateProfile(token, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        profileImageUrl,
      });

      if (!response.ok) {
        toast.error(response.error || "Failed to update profile");
        return;
      }

      console.log('[DEBUG] Backend response data:', response.data);

      // If the backend returned a full user object, use it; otherwise fall back to
      // merging the form values onto the current user. This guards against backends
      // that return an empty body on a successful update.
      const updatedUser: UserType = response.data
        ? {
            ...currentUser,
            ...response.data,
            // Explicitly set to null (not undefined) so JSON.stringify persists it
            profileImage: response.data.profileImage ?? null,
          }
        : {
            ...currentUser,
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || undefined,
            address: formData.address.trim() || undefined,
            // Trust what we sent: if we sent null, the removal succeeded
            profileImage: profileImageUrl,
          };

      console.log('[DEBUG] Saving updatedUser to context:', updatedUser);

      updateUser(updatedUser);

      const submittedEmail = formData.email.trim().toLowerCase();
      const previousEmail = currentUser.email.trim().toLowerCase();
      if (submittedEmail !== previousEmail) {
        toast.success("Email updated. Please log in again.");
        logout();
        navigate("/login");
        return;
      }

      toast.success("Profile updated successfully!");
      navigate(getDashboardPath());
    } catch (error) {
      void error;
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    currentUser,
    formData,
    isSaving,
    getDashboardPath,
    handleInputChange,
    handleProfileImageChange,
    handleCancel,
    handleSave,
  };
}
