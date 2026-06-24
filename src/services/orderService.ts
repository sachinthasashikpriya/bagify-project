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
  subtotal: number;
  tax: number;
  shipping: number;
  shippingAddress: string;
  paymentStatus: string; // UNPAID | PAID | FAILED
  paymentId?: string;
  createdAt: string;
}

export interface PayHereParams {
  sandbox: boolean;
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  amount: string;
  currency: string;
  hash: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
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
   * Get seller revenue and items sold statistics
   */
  async getSellerStats(): Promise<Result<{ totalRevenue: number; totalItemsSold: number }>> {
    return httpClient.get<{ totalRevenue: number; totalItemsSold: number }>('/api/v1/orders/seller/stats', {
      service: 'order-service',
      auth: true,
    });
  },

  /**
   * Get admin total revenue and earnings (tax) statistics
   */
  async getAdminStats(): Promise<Result<{ totalRevenue: number; adminEarnings: number }>> {
    return httpClient.get<{ totalRevenue: number; adminEarnings: number }>('/api/v1/orders/admin/stats', {
      service: 'order-service',
      auth: true,
    });
  },

  /**
   * Cancel an order (Buyer only)
   */
  async cancelOrder(orderId: number | string): Promise<Result<OrderResponse>> {
    return httpClient.put<OrderResponse>(`/api/v1/orders/${orderId}/cancel`, undefined, {
      service: 'order-service',
      auth: true,
    });
  },

  /**
   * Get PayHere sandbox parameters and signature for an order
   */
  async getPaymentParams(
    orderId: number | string,
    returnUrl: string,
    cancelUrl: string
  ): Promise<Result<PayHereParams>> {
    return httpClient.get(`/api/v1/orders/${orderId}/payment-params`, {
      service: 'order-service',
      auth: true,
      query: { returnUrl, cancelUrl },
    });
  }
};
