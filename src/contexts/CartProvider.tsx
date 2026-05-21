import { useEffect, useState } from 'react';
import type { CartItem, Product } from '../types';
import type { ReactNode } from 'react';
import { CartContext } from './CartContext';
import { cartService } from '../services/cartService';

const CART_STORAGE_KEY = 'bagify_cart_items';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse cart items from local storage:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Failed to save cart items to local storage:', error);
    }
  }, [cartItems]);

  const addToCart = async (product: Product) => {
    try {
      const result = await cartService.addToCart(product.id, 1);
      if (result.error) {
        throw new Error(result.error);
      }
      setCartItems((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prev, { product, quantity: 1 }];
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    try {
      const result = await cartService.updateQuantity(productId, quantity);
      if (result.error) {
        throw new Error(result.error);
      }
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      console.error('Failed to update quantity:', error);
      throw error;
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      const result = await cartService.removeFromCart(productId);
      if (result.error) {
        throw new Error(result.error);
      }
      setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}