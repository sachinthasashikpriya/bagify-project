import { useEffect, useState, ReactNode, useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useProducts } from "../hooks/useProduct";
import { wishlistService } from "../services/wishlistService";
import { WishlistContext } from "./WishlistContext";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const { products } = useProducts();
  
  const [wishlistProductIds, setWishlistProductIds] = useState<number[]>([]);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(true);

  // Fetch wishlist on mount or when user changes
  useEffect(() => {
    const fetchWishlist = async () => {
      if (currentUser?.role === "BUYER") {
        try {
          setIsLoadingWishlist(true);
          const result = await wishlistService.getWishlist();
          if (result.ok && result.data) {
            setWishlistProductIds(result.data);
          }
        } catch (error) {
          console.error("Failed to fetch wishlist:", error);
        } finally {
          setIsLoadingWishlist(false);
        }
      } else {
        setWishlistProductIds([]);
        setIsLoadingWishlist(false);
      }
    };

    fetchWishlist();
  }, [currentUser]);

  const wishlistProducts = useMemo(() => {
    return products.filter(p => wishlistProductIds.includes(p.id as number) || wishlistProductIds.includes(Number(p.id)));
  }, [products, wishlistProductIds]);

  const addToWishlist = async (productId: number) => {
    if (!currentUser || currentUser.role !== "BUYER") {
      toast.error("Please log in as a buyer to use the wishlist");
      return;
    }
    
    // Optimistic update
    setWishlistProductIds(prev => {
      if (prev.includes(productId)) return prev;
      return [...prev, productId];
    });

    try {
      const result = await wishlistService.addToWishlist(productId);
      if (!result.ok) {
        throw new Error(result.error || "Failed to add to wishlist");
      }
      toast.success("Added to wishlist");
    } catch (error) {
      // Revert on failure
      setWishlistProductIds(prev => prev.filter(id => id !== productId));
      toast.error(error instanceof Error ? error.message : "Failed to add to wishlist");
      throw error;
    }
  };

  const removeFromWishlist = async (productId: number) => {
    if (!currentUser || currentUser.role !== "BUYER") return;
    
    // Optimistic update
    const previous = [...wishlistProductIds];
    setWishlistProductIds(prev => prev.filter(id => id !== productId));

    try {
      const result = await wishlistService.removeFromWishlist(productId);
      if (!result.ok) {
        throw new Error(result.error || "Failed to remove from wishlist");
      }
      toast.success("Removed from wishlist");
    } catch (error) {
      // Revert on failure
      setWishlistProductIds(previous);
      toast.error(error instanceof Error ? error.message : "Failed to remove from wishlist");
      throw error;
    }
  };

  const toggleWishlist = async (productId: number) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  const isInWishlist = (productId: number) => {
    return wishlistProductIds.includes(productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistProductIds,
        wishlistProducts,
        isLoadingWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}
