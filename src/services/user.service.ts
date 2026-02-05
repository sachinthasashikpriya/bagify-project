import { env } from "../config/env";
import type { Result, User } from "../types";

const USER_SERVICE_URL = env.USER_SERVICE_BASE_URL;

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  profileImage?: string | null; // ✅ Change to File type
}

export const userService = {
  /**
   * Get current user profile
   */
  async getMyProfile(token: string): Promise<Result<User>> {
    console.log("👤 ====== GET MY PROFILE ======");

    try {
      const response = await fetch(`${USER_SERVICE_URL}/users/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      console.log("👤 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("👤 Error response:", errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          return { 
            ok: false, 
            error: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status 
          };
        }

        return {
          ok: false,
          error: errorData.error || errorData.message || "Failed to fetch profile",
          status: response.status,
        };
      }

      const data = await response.json();
      console.log("👤 Profile fetched successfully:", data);

      return {
        ok: true,
        data: data,
        status: response.status,
      };
    } catch (error) {
      console.error("👤 Network error:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  },

  /**
   * Update user profile (including profile image)
   * ✅ NOW SUPPORTS FILE UPLOAD
   */
  async updateProfile(
    token: string,
    request: UpdateProfileRequest
  ): Promise<Result<User>> {
    console.log("👤 ====== UPDATE PROFILE ======");
    console.log("👤 Request data:", {
      name: request.name,
      email: request.email,
      phone: request.phone,
      address: request.address,
      hasImage: !!request.profileImage,
    });

    try {
      // ✅ Use FormData for file uploads
      const formData = new FormData();
      
      if (request.name) formData.append('name', request.name);
      if (request.email) formData.append('email', request.email);
      if (request.phone) formData.append('phone', request.phone);
      if (request.address) formData.append('address', request.address);
      if (request.profileImage) {
        formData.append('profileImage', request.profileImage);
        console.log("👤 Adding image to FormData:", request.profileImage);
      }

      // ✅ Log FormData contents
      console.log("👤 FormData entries:");
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File(${value.name})` : value);
      }

      const response = await fetch(`${USER_SERVICE_URL}/users/me`, {
        method: "PUT",
        headers: {
          // ✅ CRITICAL: Don't set Content-Type for FormData
          // Browser will set it automatically with boundary
          "Authorization": `Bearer ${token}`,
        },
        body: formData, // ✅ Send FormData, not JSON
      });

      console.log("👤 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("👤 Error response:", errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          return { 
            ok: false, 
            error: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status 
          };
        }

        return {
          ok: false,
          error: errorData.error || errorData.message || "Failed to update profile",
          status: response.status,
        };
      }

      const data = await response.json();
      console.log("👤 Profile updated successfully:", data);

      return {
        ok: true,
        data: data,
        message: "Profile updated successfully",
        status: response.status,
      };
    } catch (error) {
      console.error("👤 Update profile error:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  },

  /**
   * Update profile image only (if you need a separate endpoint)
   */
  async updateProfileImage(
    token: string,
    profileImage: File
  ): Promise<Result<User>> {
    console.log("👤 ====== UPDATE PROFILE IMAGE ======");
    console.log("👤 Image:", profileImage.name);

    try {
      const formData = new FormData();
      formData.append('profileImage', profileImage);

      const response = await fetch(`${USER_SERVICE_URL}/users/me/profile-image`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("👤 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("👤 Error response:", errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          return { 
            ok: false, 
            error: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status 
          };
        }

        return {
          ok: false,
          error: errorData.error || errorData.message || "Failed to update profile image",
          status: response.status,
        };
      }

      const data = await response.json();
      console.log("👤 Profile image updated successfully:", data);

      return {
        ok: true,
        data: data,
        message: "Profile image updated successfully",
        status: response.status,
      };
    } catch (error) {
      console.error("👤 Update profile image error:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  },

  /**
   * Remove profile image
   */
  async removeProfileImage(token: string): Promise<Result<User>> {
    console.log("👤 ====== REMOVE PROFILE IMAGE ======");

    try {
      const response = await fetch(`${USER_SERVICE_URL}/users/me/profile-image`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      console.log("👤 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("👤 Error response:", errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          return { 
            ok: false, 
            error: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status 
          };
        }

        return {
          ok: false,
          error: errorData.error || errorData.message || "Failed to remove profile image",
          status: response.status,
        };
      }

      const data = await response.json();
      console.log("👤 Profile image removed successfully:", data);

      return {
        ok: true,
        data: data,
        message: "Profile image removed successfully",
        status: response.status,
      };
    } catch (error) {
      console.error("👤 Remove profile image error:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  },
};