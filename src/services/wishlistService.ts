import { httpClient } from "../api/httpClient";
import type { Result } from "../types";

export const wishlistService = {
  addToWishlist(productId: string | number): Promise<Result<void>> {
    return httpClient.post<void>(`/api/v1/wishlist/${productId}`, undefined, {
      service: 'user-service',
      auth: true,
    });
  },

  removeFromWishlist(productId: string | number): Promise<Result<void>> {
    return httpClient.delete<void>(`/api/v1/wishlist/${productId}`, {
      service: 'user-service',
      auth: true,
    });
  },

  getWishlist(): Promise<Result<number[]>> {
    return httpClient.get<number[]>('/api/v1/wishlist', {
      service: 'user-service',
      auth: true,
    });
  }
};
