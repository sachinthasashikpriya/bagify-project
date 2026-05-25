import { createContext } from "react";
import type { Product } from "../types";

export interface WishlistContextType {
  wishlistProductIds: number[];
  wishlistProducts: Product[];
  isLoadingWishlist: boolean;
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  toggleWishlist: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
}

export const WishlistContext = createContext<WishlistContextType | null>(null);
