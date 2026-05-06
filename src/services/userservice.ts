import { env } from "../config/env";
import { endpoints } from "../api/endpoints";
import type { Result, User } from "../types";

const USER_SERVICE_URL = env.USER_SERVICE_BASE_URL;

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
  profileImage?: string;
}

export interface VerificationRequest {
  businessName: string;
  registrationNumber: string;
  brCertificateUrl: string;
  nicImageUrl: string;
}

export const userService = {
  /**
   * Get current user profile
   */
  async getMyProfile(token: string): Promise<Result<User>> {
    try {
      const response = await fetch(`${USER_SERVICE_URL}${endpoints.users.profile}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

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
   * Update common user profile fields
   */
  async updateProfile(
    token: string,
    request: UpdateProfileRequest
  ): Promise<Result<User>> {
    try {
      const normalizedEmail = request.email?.trim().toLowerCase();
      const normalizedName = request.name?.trim();
      const normalizedPhone = request.phone?.trim();
      const normalizedAddress = request.address?.trim();
      const normalizedProfileImage = request.profileImage?.trim();

      const payload: UpdateProfileRequest = {
        ...(normalizedName !== undefined ? { name: normalizedName } : {}),
        ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
        ...(normalizedPhone !== undefined ? { phone: normalizedPhone } : {}),
        ...(normalizedAddress !== undefined
          ? { address: normalizedAddress }
          : {}),
        ...(normalizedProfileImage !== undefined
          ? { profileImage: normalizedProfileImage }
          : {}),
      };

      const response = await fetch(`${USER_SERVICE_URL}${endpoints.users.updateProfile}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

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
   * Submit seller business verification request
   */
  async submitVerification(
    token: string,
    request: VerificationRequest
  ): Promise<Result<User>> {
    try {
      const response = await fetch(`${USER_SERVICE_URL}${endpoints.users.verification}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🏢 Error response:", errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          return {
            ok: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status,
          };
        }

        return {
          ok: false,
          error: errorData.error || errorData.message || "Failed to submit verification",
          status: response.status,
        };
      }
      const data = await response.json();

      return {
        ok: true,
        data: data,
        message: "Verification request submitted successfully",
        status: response.status,
      };
    } catch (error) {
      console.error("🏢 Submit verification error:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  },

  /**
   * Change user password
   */
  async changePassword(
    token: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<Result<string>> {
    try {
      const response = await fetch(`${USER_SERVICE_URL}${endpoints.users.changePassword}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, password: newPassword, confirmPassword }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🔑 Error response:", errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          return { 
            ok: false, 
            error: errorText || `HTTP ${response.status}: ${response.statusText}`,
            status: response.status 
          };
        }

        return {
          ok: false,
          error: errorData.error || errorData.message || "Failed to change password",
          status: response.status,
        };
      }

      return {
        ok: true,
        data: "Password changed successfully",
        message: "Password changed successfully",
        status: response.status,
      };
    } catch (error) {
      console.error("🔑 Change password error:", error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  },
};