import { httpClient } from "../api/httpClient";
import type { Result } from "../types";

export interface CartItemResponse {
  id?: string;
  productId: string;
  quantity: number;
  addedAt?: string;
}

export const cartService = {
  /**
   * Add a product to cart or increase quantity
   */
  async addToCart(productId: string, quantity: number): Promise<Result<CartItemResponse>> {
    return httpClient.post<CartItemResponse>('/api/v1/cart/items', { productId, quantity }, {
      service: 'user-service',
      auth: true,
    });
  }
};
