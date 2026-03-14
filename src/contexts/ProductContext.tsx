import { createContext } from 'react';
import type { Product } from '../types';

export interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'sellerId' | 'sellerName' | 'sellerRating' | 'reviews' | 'averageRating'>) => void;
  deleteProduct: (productId: string) => void;
  addReview: (productId: string, rating: number, comment: string, buyerId: string, buyerName: string) => void;
}

export const ProductContext = createContext<ProductContextType | undefined>(undefined);