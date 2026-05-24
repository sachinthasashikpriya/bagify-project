import { httpClient } from "../api/httpClient";
import type { Result } from "../types";

export interface OrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  imageUrl?: string;
  quantity: number;
  priceAtPurchase: number;
  sellerId: string;
  itemStatus: string; // PENDING | PROCESSING | PACKED | SHIPPED | DELIVERED
}

export interface OrderResponse {
  id: number;
  buyerId: number;
  items: OrderItemResponse[];
  status: string; // Consolidated: PENDING | PROCESSING | PARTIALLY_SHIPPED | SHIPPED | DELIVERED | CANCELLED
  totalAmount: number;
  shippingAddress: string;
  createdAt: string;
}

export const orderService = {
  /**
   * Place an order from the current cart
   */
  async placeOrder(shippingAddress: string, items: { productId: number, quantity: number }[]): Promise<Result<OrderResponse>> {
    return httpClient.post<OrderResponse>('/api/v1/orders/checkout', { shippingAddress, items }, {
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
    return httpClient.get<OrderResponse[]>('/api/v1/orders', {
      service: 'order-service',
      auth: true,
    });
  },

  /**
   * Get all orders (Admin only)
   */
  async getAllOrders(): Promise<Result<OrderResponse[]>> {
    return httpClient.get<OrderResponse[]>('/api/v1/orders/all', {
      service: 'order-service',
      auth: true,
    });
  },

  /**
   * Get all orders containing products owned by the seller
   */
  async getSellerOrders(): Promise<Result<OrderResponse[]>> {
    return httpClient.get<OrderResponse[]>('/api/v1/orders/seller', {
      service: 'order-service',
      auth: true,
    });
  },

  /**
   * Update global order status — Admin only.
   */
  async updateOrderStatus(orderId: number | string, status: string): Promise<Result<OrderResponse>> {
    return httpClient.put<OrderResponse>(`/api/v1/orders/${orderId}/status?status=${status}`, undefined, {
      service: 'order-service',
      auth: true,
    });
  },

  /**
   * Update a single item's fulfillment status — Seller only.
   * After this call, the parent order's consolidated status is auto-recomputed by the backend.
   */
  async updateItemStatus(orderId: number | string, itemId: number | string, status: string): Promise<Result<OrderResponse>> {
    return httpClient.put<OrderResponse>(
      `/api/v1/orders/${orderId}/items/${itemId}/status?status=${status}`,
      undefined,
      { service: 'order-service', auth: true }
    );
  },

  /**
   * Admin override to update a single item's fulfillment status (including DELIVERED).
   */
  async updateItemStatusAdmin(orderId: number | string, itemId: number | string, status: string): Promise<Result<OrderResponse>> {
    return httpClient.put<OrderResponse>(
      `/api/v1/orders/${orderId}/items/${itemId}/status/admin?status=${status}`,
      undefined,
      { service: 'order-service', auth: true }
    );
  },

  /**
   * Cancel an order (Buyer only)
   */
  async cancelOrder(orderId: number | string): Promise<Result<OrderResponse>> {
    return httpClient.put<OrderResponse>(`/api/v1/orders/${orderId}/cancel`, undefined, {
      service: 'order-service',
      auth: true,
    });
  }
};
