import { useState, useEffect, useCallback } from 'react';
import type { Product, Review } from '../types';
import type { ReactNode } from 'react';
import { ProductContext } from './ProductContext';
import { productService } from '../services/productService';
import { toast } from 'sonner';

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await productService.getProducts();
      if (result.ok && result.data) {
        setProducts(result.data);
      } else {
        setError(result.error || 'Failed to fetch products');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (
    productData: Omit<Product, 'id' | 'sellerId' | 'sellerName' | 'sellerRating' | 'reviews' | 'averageRating'>
  ) => {
    try {
      const result = await productService.createProduct(productData);
      if (result.ok && result.data) {
        setProducts((prev) => [...prev, result.data!]);
        toast.success('Product added successfully!');
      } else {
        // Fallback to local state if request is unauthorized/fails (e.g. for testing without token)
        const localProduct: Product = {
          ...productData,
          id: `p${Date.now()}`,
          sellerId: 'local',
          sellerName: 'Local Seller',
          sellerRating: 5.0,
          reviews: [],
          averageRating: 0.0,
        };
        setProducts((prev) => [...prev, localProduct]);
        toast.info('Added locally (backend offline or unauthorized)');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to add product');
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const result = await productService.deleteProduct(productId);
      if (result.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        toast.success('Product deleted successfully!');
      } else {
        // Fallback for local deletion
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        toast.info('Deleted locally');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete product');
    }
  };

  const updateProduct = async (
    productId: string,
    updates: Partial<Omit<Product, 'id' | 'sellerId' | 'sellerName' | 'sellerRating' | 'reviews' | 'averageRating'>>
  ): Promise<boolean> => {
    try {
      const result = await productService.updateProduct(productId, updates);
      if (result.ok && result.data) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? result.data! : p))
        );
        toast.success('Product updated successfully!');
        return true;
      } else {
        // Fallback to local state if request fails or backend offline
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  ...updates,
                }
              : p
          )
        );
        toast.info('Updated locally (backend offline or unauthorized)');
        return true;
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update product');
      return false;
    }
  };

  const addReview = async (
    productId: string,
    rating: number,
    comment: string,
    buyerId: string,
    buyerName: string
  ) => {
    try {
      const result = await productService.addReview(productId, rating, comment);
      if (result.ok && result.data) {
        // Update product in the list with the updated backend data
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? result.data! : p))
        );
        toast.success('Review submitted successfully!');
      } else {
        // Fallback to local state update if not authenticated
        const newReview: Review = {
          id: `r${Math.random().toString(36).substring(2, 11)}`,
          productId,
          buyerId,
          buyerName,
          rating,
          comment,
          date: new Date().toISOString().split('T')[0],
        };

        setProducts((prev) =>
          prev.map((product) => {
            if (product.id === productId) {
              const updatedReviews = [...product.reviews, newReview];
              const averageRating =
                updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
              return { ...product, reviews: updatedReviews, averageRating };
            }
            return product;
          })
        );
        toast.info('Review added locally');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit review');
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        isLoading,
        error,
        addProduct,
        updateProduct,
        deleteProduct,
        addReview,
        refreshProducts: fetchProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}