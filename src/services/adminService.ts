import { httpClient } from "../api/httpClient";
import type { Result, User } from "../types";

function mapBackendUserToFrontendUser(user: any): User {
  const mappedUser: User = {
    ...user,
    profileImage: user.profileImageUrl,
    id: user.id?.toString(),
    status: user.enabled !== undefined ? (user.enabled ? 'ENABLED' : 'DISABLED') : 'ENABLED',
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

export const adminService = {
  /**
   * Get all sellers with verificationStatus = PENDING (Admin only)
   */
  async getPendingVerifications(): Promise<Result<User[]>> {
    const result = await httpClient.get<any[]>('/api/v1/admin/verifications', {
      service: 'user-service',
      auth: true,
    });

    if (result.ok && result.data) {
      const mapped = result.data.map(mapBackendUserToFrontendUser);
      return { ...result, data: mapped };
    }

    return { ...result, data: undefined };
  },

  /**
   * Approve seller verification request (Admin only)
   */
  async approveVerification(sellerId: string): Promise<Result<User>> {
    const result = await httpClient.put<any>(
      `/api/v1/admin/verifications/${sellerId}`,
      { decision: 'APPROVED' },
      {
        service: 'user-service',
        auth: true,
      }
    );

    if (result.ok && result.data) {
      const mapped = mapBackendUserToFrontendUser(result.data);
      return { ...result, data: mapped };
    }

    return result;
  },

  /**
   * Reject seller verification request with a reason (Admin only)
   */
  async rejectVerification(sellerId: string, reason: string): Promise<Result<User>> {
    const result = await httpClient.put<any>(
      `/api/v1/admin/verifications/${sellerId}`,
      { decision: 'REJECTED', rejectionReason: reason },
      {
        service: 'user-service',
        auth: true,
      }
    );

    if (result.ok && result.data) {
      const mapped = mapBackendUserToFrontendUser(result.data);
      return { ...result, data: mapped };
    }

    return result;
  },
};
