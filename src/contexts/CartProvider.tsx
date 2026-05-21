import { useEffect, useState } from 'react';
import type { CartItem, Product } from '../types';
import type { ReactNode } from 'react';
import { CartContext } from './CartContext';
import { cartService } from '../services/cartService';
import { useAuth } from '../hooks/useAuth';

const CART_STORAGE_KEY = 'bagify_cart_items';

export function CartProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
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
    async function loadCart() {
      if (currentUser?.role === 'BUYER') {
        const result = await cartService.getCart();
        if (result.ok && result.data) {
          const items: CartItem[] = result.data.map((dto) => ({
            product: {
              id: String(dto.productId),
              name: dto.productName || '',
              description: '', // Backend doesn't send description in DTO yet, or we can use placeholder
              price: dto.price || 0,
              category: '',
              image: dto.productImage || '',
              sellerId: '',
              sellerName: '',
              sellerRating: 0,
              stock: dto.stock || 0,
              reviews: [],
              averageRating: 0,
            },
            quantity: dto.quantity,
          }));
          setCartItems(items);
        }
      } else if (!currentUser) {
        setCartItems([]);
      }
    }
    loadCart();
  }, [currentUser]);

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

  const clearCart = async () => {
    try {
      const result = await cartService.clearCart();
      if (result.error) {
        throw new Error(result.error);
      }
      setCartItems([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}