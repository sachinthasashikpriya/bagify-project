import { endpoints } from "../api/endpoints";
import { httpClient } from "../api/httpClient";
import type { Result, User } from "../types";

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
  profileImageUrl?: string;
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
  async getMyProfile(_token?: string): Promise<Result<User>> {
    const result = await httpClient.get<any>(endpoints.users.profile, {
      service: 'user-service',
      auth: true,
    });

    if (result.ok && result.data) {
      const user = result.data;
      const mappedUser: User = {
        ...user,
        profileImage: user.profileImageUrl || user.profileImage,
        id: user.id.toString(),
      };
      return { ...result, data: mappedUser };
    }

    return result;
  },

  /**
   * Update common user profile fields
   */
  async updateProfile(
    _token: string,
    request: UpdateProfileRequest
  ): Promise<Result<User>> {
    const normalizedEmail = request.email?.trim().toLowerCase();
    const normalizedName = request.name?.trim();
    const normalizedPhone = request.phone?.trim();
    const normalizedAddress = request.address?.trim();
    const normalizedProfileImageUrl = request.profileImageUrl?.trim();

    const payload: UpdateProfileRequest = {
      ...(normalizedName !== undefined ? { name: normalizedName } : {}),
      ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
      ...(normalizedPhone !== undefined ? { phone: normalizedPhone } : {}),
      ...(normalizedAddress !== undefined
        ? { address: normalizedAddress }
        : {}),
      ...(normalizedProfileImageUrl !== undefined
        ? { profileImageUrl: normalizedProfileImageUrl }
        : {}),
    };

    const result = await httpClient.put<any>(endpoints.users.updateProfile, payload, {
      service: 'user-service',
      auth: true,
    });

    if (result.ok && result.data) {
      const user = result.data;
      const mappedUser: User = {
        ...user,
        profileImage: user.profileImageUrl || user.profileImage,
        id: user.id.toString(),
      };
      return { ...result, data: mappedUser };
    }

    return result;
  },

  /**
   * Submit seller business verification request
   */
  async submitVerification(
    _token: string,
    request: VerificationRequest
  ): Promise<Result<User>> {
    return httpClient.post<User>(endpoints.users.verification, request, {
      service: 'user-service',
      auth: true,
    });
  },

  /**
   * Change user password
   */
  async changePassword(
    _token: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<Result<string>> {
    return httpClient.post<string>(endpoints.users.changePassword, 
      { currentPassword, password: newPassword, confirmPassword }, 
      {
        service: 'user-service',
        auth: true,
      }
    );
  },
};