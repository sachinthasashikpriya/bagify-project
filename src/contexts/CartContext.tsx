import { createContext } from 'react';
import type { CartItem, Product } from '../types';

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);