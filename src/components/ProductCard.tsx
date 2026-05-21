import { Star, ShoppingCart, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '../types';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  onViewDetails: (productId: string) => void;
  onAddToCart?: (product: Product) => Promise<void>;
}

export function ProductCard({ product, onViewDetails, onAddToCart }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const isOutOfStock = product.stock <= 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAddToCart || isOutOfStock) return;
    try {
      setIsAdding(true);
      await onAddToCart(product);
    } catch (error) {
      const e = error as Error;
      toast.error(e.message || 'Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden cursor-pointer">
      <div onClick={() => onViewDetails(product.id)}>
        <div className="aspect-square overflow-hidden bg-gray-100">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-gray-900 line-clamp-1">{product.name}</h3>
            <span className="text-purple-600">${product.price}</span>
          </div>
          
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {product.description}
          </p>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-gray-700">
                  {product.averageRating > 0 ? product.averageRating.toFixed(1) : 'New'}
                </span>
              </div>
              <div className="text-xs text-gray-500">{product.sellerName}</div>
            </div>
            
            <div className="text-xs text-gray-500">
              {product.stock} in stock
            </div>
          </div>
        </div>
      </div>

      {onAddToCart && (
        <div className="px-4 pb-4">
          <button
            onClick={handleAdd}
            disabled={isAdding || isOutOfStock}
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
            {isOutOfStock ? 'Out of Stock' : isAdding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      )}
    </div>
  );
}
