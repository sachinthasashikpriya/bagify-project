import { endpoints } from "../api/endpoints";
import { httpClient } from "../api/httpClient";
import type { Result, Complaint, ComplaintRequest } from "../types";

export const complaintService = {
  /**
   * Submit a new buyer complaint
   */
  async submitComplaint(complaintData: ComplaintRequest): Promise<Result<Complaint>> {
    return httpClient.post<Complaint>(endpoints.complaints.base, complaintData, {
      service: 'product-service',
      auth: true,
    });
  },

  /**
   * Get all complaints created by the authenticated buyer
   */
  async getMyComplaints(): Promise<Result<Complaint[]>> {
    return httpClient.get<Complaint[]>(endpoints.complaints.me, {
      service: 'product-service',
      auth: true,
    });
  },
};
