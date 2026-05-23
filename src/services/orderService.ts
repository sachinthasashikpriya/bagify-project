import { httpClient } from "../api/httpClient";
import type { Result } from "../types";

export interface OrderResponse {
  id: number;
  buyerId: number;
  items: {
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    priceAtPurchase: number;
  }[];
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
    return httpClient.post<OrderResponse>('/api/v1/orders/checkout', { shippingAddress }, {
      service: 'order-service',
      auth: true,
    });
  },

  /**
   * Get order details by ID
   */
  async getOrder(orderId: number | string): Promise<Result<OrderResponse>> {
    return httpClient.get<OrderResponse>(`/api/v1/orders/${orderId}`, {
      service: 'order-service',
      auth: true,
    });
  },

  /**
   * Get all orders for the current buyer
   */
  async getMyOrders(): Promise<Result<OrderResponse[]>> {
    return httpClient.get<OrderResponse[]>('/api/v1/orders/my-orders', {
      service: 'order-service',
      auth: true,
    });
  }
};
