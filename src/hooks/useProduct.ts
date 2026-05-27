import { useCallback, useContext } from 'react';
import { ProductContext } from '../contexts/ProductContext';
import type { Product, Review } from '../types';

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }

  const {
    products,
    isLoading,
    error,
    addProduct: contextAddProduct,
    updateProduct: contextUpdateProduct,
    deleteProduct: contextDeleteProduct,
    addReview: contextAddReview,
    refreshProducts,
  } = context;

  // Get single product by ID
  const getProduct = useCallback((productId: string): Product | undefined => {
    // Both number or string matching for robustness
    return products.find(p => String(p.id) === String(productId));
  }, [products]);

  // Get products by seller ID
  const getProductsBySeller = useCallback((sellerId: string): Product[] => {
    return products.filter(p => String(p.sellerId) === String(sellerId));
  }, [products]);

  // Get products by category
  const getProductsByCategory = useCallback((category: string): Product[] => {
    if (category === 'all') return products;
    return products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }, [products]);

  // Add a new product (for sellers)
  const addProduct = useCallback(async (
    product: Omit<Product, 'id' | 'reviews' | 'averageRating' | 'sellerId' | 'sellerName' | 'sellerRating'>
  ): Promise<void> => {
    await contextAddProduct(product);
  }, [contextAddProduct]);

  // Update a product (for sellers)
  const updateProduct = useCallback(async (
    productId: string,
    updates: Partial<Omit<Product, 'id' | 'sellerId' | 'sellerName' | 'sellerRating' | 'reviews' | 'averageRating'>>
  ): Promise<boolean> => {
    return await contextUpdateProduct(productId, updates);
  }, [contextUpdateProduct]);

  // Delete a product
  const deleteProduct = useCallback(async (productId: string): Promise<void> => {
    await contextDeleteProduct(productId);
  }, [contextDeleteProduct]);

  // Add a review to a product
  const addReview = useCallback(async (
    productId: string,
    review: Omit<Review, 'id' | 'productId' | 'date'>
  ): Promise<void> => {
    await contextAddReview(productId, review.rating, review.comment, review.buyerId, review.buyerName);
  }, [contextAddReview]);

  // Search products
  const searchProducts = useCallback((query: string): Product[] => {
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
    );
  }, [products]);

  // Get all unique categories
  const getCategories = useCallback((): string[] => {
    return Array.from(new Set(products.map(p => p.category)));
  }, [products]);

  return {
    products,
    isLoading,
    error,
    getProduct,
    getProductsBySeller,
    getProductsByCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    addReview,
    searchProducts,
    getCategories,
    refreshProducts,
  };
}