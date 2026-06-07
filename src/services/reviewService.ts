import { endpoints } from "../api/endpoints";
import { httpClient } from "../api/httpClient";
import type { Result } from "../types";

export interface ReviewRequest {
  productId: number;
  rating: number;
  comment: string;
}

export const reviewService = {
  /**
   * Get reviews for a specific product
   */
  async getReviews(productId: number): Promise<Result<any>> {
    return httpClient.get(endpoints.reviews.base, {
      service: 'product-service',
      auth: false,
      query: { productId: productId.toString() },
    });
  },

  /**
   * Submit a new product review
   */
  async submitReview(reviewData: ReviewRequest): Promise<Result<any>> {
    return httpClient.post(endpoints.reviews.base, reviewData, {
      service: 'product-service',
      auth: true,
    });
  },

  /**
   * Get all reviews created by the authenticated buyer
   */
  async getMyReviews(): Promise<Result<any>> {
    return httpClient.get(endpoints.reviews.me, {
      service: 'product-service',
      auth: true,
    });
  },
};
