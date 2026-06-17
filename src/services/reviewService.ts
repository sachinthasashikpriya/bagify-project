import { endpoints } from "../api/endpoints";
import { httpClient } from "../api/httpClient";
import type { Result, Review } from "../types";

export interface ReviewRequest {
  productId: number;
  rating: number;
  comment: string;
}

export const reviewService = {
  /**
   * Get reviews for a specific product
   */
  async getReviews(productId: number): Promise<Result<Review[]>> {
    return httpClient.get<Review[]>(endpoints.reviews.base, {
      service: 'product-service',
      auth: false,
      query: { productId: productId.toString() },
    });
  },

  /**
   * Submit a new product review
   */
  async submitReview(reviewData: ReviewRequest): Promise<Result<Review>> {
    return httpClient.post<Review>(endpoints.reviews.base, reviewData, {
      service: 'product-service',
      auth: true,
    });
  },

  /**
   * Get all reviews created by the authenticated buyer
   */
  async getMyReviews(): Promise<Result<Review[]>> {
    return httpClient.get<Review[]>(endpoints.reviews.me, {
      service: 'product-service',
      auth: true,
    });
  },
};
