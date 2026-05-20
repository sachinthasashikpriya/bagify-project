import { httpClient } from "../api/httpClient";
import type { Result, Product } from "../types";

export const productService = {
  /**
   * Fetch all active/published products
   */
  async getProducts(category?: string, search?: string): Promise<Result<Product[]>> {
    const query: Record<string, string> = {};
    if (category) query.category = category;
    if (search) query.search = search;
    
    return httpClient.get<Product[]>('/api/v1/products', {
      service: 'product-service',
      auth: false, // public permitAll endpoint
      query: Object.keys(query).length > 0 ? query : undefined,
    });
  },

  /**
   * Get single product details
   */
  async getProductById(productId: string): Promise<Result<Product>> {
    return httpClient.get<Product>(`/api/v1/products/${productId}`, {
      service: 'product-service',
      auth: false,
    });
  },

  /**
   * Create a new product (for sellers)
   */
  async createProduct(
    productData: Omit<Product, 'id' | 'sellerId' | 'sellerName' | 'sellerRating' | 'reviews' | 'averageRating'>
  ): Promise<Result<Product>> {
    return httpClient.post<Product>('/api/v1/products', productData, {
      service: 'product-service',
      auth: true,
    });
  },

  /**
   * Delete a product (for sellers/admins)
   */
  async deleteProduct(productId: string): Promise<Result<void>> {
    return httpClient.delete<void>(`/api/v1/products/${productId}`, {
      service: 'product-service',
      auth: true,
    });
  },

  /**
   * Add a review to a product (for buyers)
   */
  async addReview(
    productId: string,
    rating: number,
    comment: string
  ): Promise<Result<Product>> {
    return httpClient.post<Product>(`/api/v1/products/${productId}/reviews`, { rating, comment }, {
      service: 'product-service',
      auth: true,
    });
  }
};
