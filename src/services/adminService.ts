import { endpoints } from "../api/endpoints";
import { httpClient } from "../api/httpClient";
import type { Result, SellerVerificationResponse } from "../types";

export const adminService = {
  /**
   * Get all pending seller verifications
   */
  async getPendingVerifications(): Promise<Result<SellerVerificationResponse[]>> {
    return httpClient.get<SellerVerificationResponse[]>(endpoints.admin.verifications, {
      service: 'user-service',
      auth: true,
    });
  },

  /**
   * Approve seller business verification request
   */
  async approveVerification(sellerId: number): Promise<Result<SellerVerificationResponse>> {
    return httpClient.put<SellerVerificationResponse>(
      endpoints.admin.reviewVerification(sellerId),
      { decision: "APPROVED" },
      {
        service: 'user-service',
        auth: true,
      }
    );
  },

  /**
   * Reject seller business verification request with a reason
   */
  async rejectVerification(sellerId: number, reason: string): Promise<Result<SellerVerificationResponse>> {
    return httpClient.put<SellerVerificationResponse>(
      endpoints.admin.reviewVerification(sellerId),
      { decision: "REJECTED", rejectionReason: reason },
      {
        service: 'user-service',
        auth: true,
      }
    );
  },
};
