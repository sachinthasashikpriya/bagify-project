import { httpClient } from "../api/httpClient";
import type { Result } from "../types";

export interface OrderResponse {
  id: number;
  buyerId: number;
  items: any[];
  status: string;
  totalAmount: number;
  shippingAddress: string;
  createdAt: string;
}

export const orderService = {
  /**
   * Place an order from the current cart
   */
  async placeOrder(shippingAddress: string): Promise<Result<OrderResponse>> {
    return httpClient.post<OrderResponse>('/api/v1/orders', { shippingAddress }, {
      service: 'user-service',
      auth: true,
    });
  }
};
