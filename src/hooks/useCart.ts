import { useContext } from 'react';
import { CartContext, type CartContextType } from '../contexts/CartContext';

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}