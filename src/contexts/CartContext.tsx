import { createContext } from 'react';
import type { CartItem, Product } from '../types';

export interface CartContextType {
  cartItems: CartItem[];
  isLoadingCart: boolean;
  addToCart: (product: Product) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);