import { useState, useCallback } from 'react';
import { mockProducts } from '../types';
import type { Product, Review } from '../types';

export function useProducts() {
  // ✅ Initialize with mock data
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get single product by ID
  const getProduct = useCallback((productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  }, [products]);

  // Get products by seller ID
  const getProductsBySeller = useCallback((sellerId: string): Product[] => {
    return products.filter(p => p.sellerId === sellerId);
  }, [products]);

  // Get products by category
  const getProductsByCategory = useCallback((category: string): Product[] => {
    if (category === 'all') return products;
    return products.filter(p => p.category === category);
  }, [products]);

  // Add a new product (for sellers)
  const addProduct = useCallback((product: Omit<Product, 'id' | 'reviews' | 'averageRating'>): Product => {
    const newProduct: Product = {
      ...product,
      id: `p${Date.now()}`,
      reviews: [],
      averageRating: 0,
    };
    
    setProducts(prev => [...prev, newProduct]);
    return newProduct;
  }, []);

  // Update a product
  const updateProduct = useCallback((productId: string, updates: Partial<Product>): void => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, ...updates } : p
    ));
  }, []);

  // Delete a product
  const deleteProduct = useCallback((productId: string): void => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  // Add a review to a product
  const addReview = useCallback((productId: string, review: Review): void => {
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      
      const updatedReviews = [...p.reviews, review];
      const averageRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
      
      return {
        ...p,
        reviews: updatedReviews,
        averageRating: Math.round(averageRating * 10) / 10,
      };
    }));
  }, []);

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

  // Refresh products (simulate API call)
  const refreshProducts = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In the future, replace this with actual API call:
      // const result = await productService.getProducts();
      // if (result.ok && result.data) {
      //   setProducts(result.data);
      // }
      
      // For now, just reset to mock data
      setProducts(mockProducts);
    } catch (err) {
      setError('Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

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