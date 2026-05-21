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
  },

  /**
   * Update quantity of an item in the cart
   */
  async updateQuantity(productId: string, quantity: number): Promise<Result<void>> {
    return httpClient.put<void>(`/api/v1/cart/items/${productId}`, { quantity }, {
      service: 'user-service',
      auth: true,
    });
  },

  /**
   * Remove an item from the cart
   */
  async removeFromCart(productId: string): Promise<Result<void>> {
    return httpClient.delete<void>(`/api/v1/cart/items/${productId}`, {
      service: 'user-service',
      auth: true,
    });
  }
};
