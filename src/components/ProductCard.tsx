import { Star, ShoppingCart, Loader2, Heart, BadgeCheck } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '../types';
import { toast } from 'sonner';
import { useWishlist } from '../hooks/useWishlist';
import { Typography } from './common/Typography';

interface ProductCardProps {
  product: Product;
  onViewDetails: (productId: string) => void;
  onAddToCart?: (product: Product) => Promise<void>;
}

export function ProductCard({ product, onViewDetails, onAddToCart }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isOutOfStock = product.stock <= 0;
  const inWishlist = isInWishlist(Number(product.id));

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

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleWishlist(Number(product.id));
    } catch (error) {
      // Error is handled in the context
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden cursor-pointer relative">
      <div onClick={() => onViewDetails(String(product.id))}>
        <div className="aspect-square overflow-hidden bg-gray-100 relative">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          <button
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm transition-colors shadow-sm"
            title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart 
              className={`w-5 h-5 ${inWishlist ? "fill-red-500 text-red-500" : "text-gray-600"}`} 
            />
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Typography variant="h4" className="text-gray-900 line-clamp-1 font-semibold">{product.name}</Typography>
            <Typography variant="body" className="text-purple-600 font-bold">Rs. {product.price}</Typography>
          </div>
          
          <Typography variant="body-sm" className="text-gray-600 line-clamp-2 mb-3">
             {product.description}
          </Typography>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <Typography variant="body-sm" as="span" className="text-gray-700 font-medium">
                  {product.averageRating > 0 ? product.averageRating.toFixed(1) : 'New'}
                </Typography>
              </div>
              <Typography variant="caption" className="text-gray-500 flex items-center gap-1">
                <span>{product.sellerName}</span>
                {product.sellerVerified && (
                  <BadgeCheck className="w-4 h-4 fill-blue-500 text-white" title="Verified Seller" />
                )}
              </Typography>
            </div>
            
            <Typography variant="caption" className="text-gray-500 font-medium">
              {product.stock} in stock
            </Typography>
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
