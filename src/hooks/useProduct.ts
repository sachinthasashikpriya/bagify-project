import { useContext } from 'react';
import { ProductContext, type ProductContextType } from '../contexts/ProductContext';

export function useProducts(): ProductContextType {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within ProductProvider');
  }
  return context;
}