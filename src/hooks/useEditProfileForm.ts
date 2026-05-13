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
  profileImage: string;
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
    profileImage: currentUser?.profileImage || "",
    createdAt: currentUser?.createdAt,
  });

  // ✅ Update form data when currentUser changes (e.g. after initial fetch)
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || currentUser.name || "",
        email: prev.email || currentUser.email || "",
        phone: prev.phone || currentUser.phone || "",
        address: prev.address || currentUser.address || "",
        profileImage: prev.profileImage || currentUser.profileImage || "",
        createdAt: currentUser.createdAt,
      }));
    }
  }, [currentUser]);

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
    setFormData((prev) => ({ ...prev, profileImage: imageUrl || "" }));
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

    setIsSaving(true);

    try {
      const response = await userService.updateProfile(token, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        profileImage: formData.profileImage || undefined,
      });

      if (!response.ok) {
        toast.error(response.error || "Failed to update profile");
        return;
      }

      const updatedUserFromBackend = response.data;

      const updatedUser: UserType = {
        ...currentUser,
        name: updatedUserFromBackend?.name || formData.name.trim(),
        email: updatedUserFromBackend?.email || formData.email.trim(),
        phone: updatedUserFromBackend?.phone || formData.phone.trim(),
        address: updatedUserFromBackend?.address || formData.address.trim(),
        profileImage: updatedUserFromBackend?.profileImage ?? formData.profileImage,
      };

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
