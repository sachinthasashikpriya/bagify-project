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

  /**
   * Get all complaints filed against the authenticated seller's products
   */
  async getSellerComplaints(): Promise<Result<Complaint[]>> {
    return httpClient.get<Complaint[]>(endpoints.complaints.seller, {
      service: 'product-service',
      auth: true,
    });
  },

  /**
   * Update the status of a complaint (e.g. to RESOLVED)
   */
  async updateComplaintStatus(id: string, status: string): Promise<Result<Complaint>> {
    return httpClient.put<Complaint>(`${endpoints.complaints.base}/${id}/status?status=${status}`, {}, {
      service: 'product-service',
      auth: true,
    });
  },
};
