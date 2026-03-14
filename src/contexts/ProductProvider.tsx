import { useState } from 'react';
import type { Product, Review } from '../types';
import { mockProducts } from '../types';
import type { ReactNode } from 'react';
import { ProductContext } from './ProductContext';

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(mockProducts);

  const addProduct = (productData: Omit<Product, 'id' | 'sellerId' | 'sellerName' | 'sellerRating' | 'reviews' | 'averageRating'>) => {
    const newProduct: Product = {
      ...productData,
      id: `p${products.length + 1}`,
      sellerId: '',
      sellerName: '',
      sellerRating: 0,
      reviews: [],
      averageRating: 0,
    };
    setProducts((prev) => [...prev, newProduct]);
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const addReview = (productId: string, rating: number, comment: string, buyerId: string, buyerName: string) => {
    const newReview: Review = {
      id: `r${Math.random().toString(36).substr(2, 9)}`,
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
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, deleteProduct, addReview }}>
      {children}
    </ProductContext.Provider>
  );
}