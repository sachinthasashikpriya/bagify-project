import { endpoints } from "../api/endpoints";
import { httpClient } from "../api/httpClient";
import type { Result, User, UserProfileResponse } from "../types";

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
  profileImageUrl?: string | null;
}

export interface VerificationRequest {
  businessName: string;
  registrationNumber: string;
  brCertificateUrl: string;
  nicImageUrl: string;
}

function mapBackendUserToFrontendUser(user: any): User {
  const mappedUser: User = {
    ...user,
    profileImage: user.profileImageUrl,
    id: user.id?.toString(),
  };

  if (user.role === 'SELLER' && user.verificationStatus) {
    mappedUser.verification = {
      status: user.verificationStatus,
      businessName: user.businessName || '',
      registrationNumber: user.registrationNumber || '',
      nicImageUrl: user.nicImageUrl,
      brCertificateUrl: user.brCertificateUrl,
      rejectionReason: user.rejectionReason,
      submittedAt: user.submittedAt,
    };
  }

  return mappedUser;
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
      const mappedUser = mapBackendUserToFrontendUser(user);
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

    const payload: UpdateProfileRequest = {
      ...(normalizedName !== undefined ? { name: normalizedName } : {}),
      ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
      ...(normalizedPhone !== undefined ? { phone: normalizedPhone } : {}),
      ...(normalizedAddress !== undefined
        ? { address: normalizedAddress }
        : {}),
      ...(request.profileImageUrl !== undefined
        ? { profileImageUrl: request.profileImageUrl }
        : {}),
    };

    const result = await httpClient.put<any>(endpoints.users.updateProfile, payload, {
      service: 'user-service',
      auth: true,
    });

    if (result.ok && result.data) {
      const user = result.data;
      const mappedUser = mapBackendUserToFrontendUser(user);
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
    const result = await httpClient.post<any>(endpoints.users.verification, request, {
      service: 'user-service',
      auth: true,
    });

    if (result.ok && result.data) {
      const user = result.data;
      const mappedUser = mapBackendUserToFrontendUser(user);
      return { ...result, data: mappedUser };
    }

    return result;
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

  /**
   * Delete current user account
   */
  async deleteAccount(): Promise<Result<void>> {
    return httpClient.delete<void>(endpoints.users.me, {
      service: 'user-service',
      auth: true,
    });
  },

  /**
   * Get all registered users (Admin only)
   */
  async getAllUsers(): Promise<Result<UserProfileResponse[]>> {
    return httpClient.get<UserProfileResponse[]>(endpoints.users.getAll, {
      service: 'user-service',
      auth: true,
    });
  },

  /**
   * Disable user account (Admin only)
   */
  async disableUser(id: number | string): Promise<Result<string>> {
    return httpClient.put<string>(endpoints.users.disable(id), {}, {
      service: 'user-service',
      auth: true,
    });
  },

  /**
   * Enable user account (Admin only)
   */
  async enableUser(id: number | string): Promise<Result<string>> {
    return httpClient.put<string>(endpoints.users.enable(id), {}, {
      service: 'user-service',
      auth: true,
    });
  },
};