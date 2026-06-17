import { Loader2, ArrowLeft, Package, ShoppingCart, Star, Store, Heart, BadgeCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { useProducts } from "../hooks/useProduct";
import { useWishlist } from "../hooks/useWishlist";
import { productService } from "../services/productService";
import { reviewService } from "../services/reviewService";
import type { Product, Review } from "../types";

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const { products, refreshProducts } = useProducts();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const product = fetchedProduct || products.find((p) => String(p.id) === String(productId));

  useEffect(() => {
    if (productId) {
      const hasCached = products.some((p) => String(p.id) === String(productId));
      if (!hasCached) {
        setIsLoading(true);
      }
      setFetchError(false);
      productService.getProductById(productId)
        .then((res) => {
          if (res.data) {
            setFetchedProduct(res.data);
          } else {
            if (!hasCached) setFetchError(true);
          }
        })
        .catch(() => {
          if (!hasCached) setFetchError(true);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [productId, products]);

  useEffect(() => {
    if (productId) {
      setIsLoadingReviews(true);
      reviewService.getReviews(Number(productId))
        .then(res => {
          if (res.ok && res.data) {
            setReviews(res.data);
          } else {
            console.error("Failed to fetch reviews:", res.error);
          }
        })
        .catch(err => console.error("Failed to fetch reviews:", err))
        .finally(() => setIsLoadingReviews(false));
    }
  }, [productId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse flex items-center gap-2 text-gray-300 mb-6">
            <div className="w-5 h-5 bg-gray-300 rounded"></div>
            <div className="w-32 h-4 bg-gray-300 rounded"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-200 rounded-xl aspect-square animate-pulse"></div>
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-6 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
              <div className="space-y-3 mb-6">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product || fetchError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to products
          </Link>
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Product not found
            </h2>
            <p className="text-gray-500 mb-4">
              The product you're looking for doesn't exist.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!currentUser) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }
    if (currentUser.role !== "BUYER") {
      toast.error("Only buyers can add items to cart");
      return;
    }
    if (product.stock <= 0) {
      toast.error("Product is out of stock");
      return;
    }

    try {
      setIsAddingToCart(true);
      await addToCart(product);
      toast.success("Added to cart!");
    } catch (error) {
      const e = error as Error;
      toast.error(e.message || "Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!currentUser) {
      toast.error("Please login to submit a review");
      navigate("/login");
      return;
    }

    if (currentUser.role !== "BUYER") {
      toast.error("Only buyers can submit reviews");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please write a review comment");
      return;
    }

    try {
      const submitRes = await reviewService.submitReview({
        productId: Number(product.id),
        rating,
        comment: comment.trim(),
      });
      
      if (!submitRes.ok) {
        toast.error(submitRes.error || "Failed to submit review");
        return;
      }

      toast.success("Review submitted successfully!");
      setComment("");
      setRating(5);
      setShowReviewForm(false);
      
      // Refresh the product's review list from the backend
      const reviewRes = await reviewService.getReviews(Number(product.id));
      if (reviewRes.ok && reviewRes.data) {
        setReviews(reviewRes.data);
      }
      
      const res = await productService.getProductById(String(product.id));
      if (res.data) {
        setFetchedProduct(res.data);
      }
      
      // Also refresh the global products list
      await refreshProducts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit review";
      toast.error(errorMessage);
    }
  };

  const hasAlreadyReviewed = currentUser ? reviews.some(r => r.buyerId === String(currentUser.id)) : false;

  const averageRating = product.averageRating || (reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/"
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <img
              src={product.image}
              alt={product.name}
              className="w-full aspect-square object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/400x400?text=No+Image';
              }}
            />
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= averageRating
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-700 font-medium">
                  {averageRating > 0
                    ? averageRating.toFixed(1)
                    : "No ratings yet"}
                </span>
                <span className="text-gray-500">
                  ({reviews.length} reviews)
                </span>
              </div>
            </div>

            <div className="text-3xl font-bold text-purple-600 mb-6">
              Rs. {product.price.toFixed(2)}
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">{product.description}</p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2 text-gray-700">
                <Package className="w-5 h-5 text-gray-400" />
                <span>
                  Category:{" "}
                  <span className="font-medium capitalize">{product.category}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Package className="w-5 h-5 text-gray-400" />
                <span>
                  Stock:{" "}
                  <span className={`font-medium ml-1 ${
                    product.stock > 10 ? 'text-green-600' : 
                    product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                  </span>
                </span>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-600 text-sm mb-2">Sold by</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Store className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <span>{product.sellerName || "BagMarket Store"}</span>
                    {product.sellerVerified && (
                      <span title="Verified Seller">
                        <BadgeCheck className="w-5 h-5 fill-blue-500 text-white" />
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-gray-600 text-sm">
                      Seller Rating: {product.sellerRating?.toFixed(1) || "4.5"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0 || !currentUser || currentUser.role !== "BUYER" || isAddingToCart}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
                >
                  {isAddingToCart ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-5 h-5" />
                  )}
                  {product.stock <= 0 ? "Out of Stock" : isAddingToCart ? "Adding..." : "Add to Cart"}
                </button>

                {currentUser?.role === "BUYER" && (
                  <button
                    onClick={() => toggleWishlist(Number(product.id))}
                    className="px-4 border border-gray-200 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
                    title={isInWishlist(Number(product.id)) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart 
                      className={`w-6 h-6 ${isInWishlist(Number(product.id)) ? "fill-red-500 text-red-500" : "text-gray-400"}`} 
                    />
                  </button>
                )}
              </div>

              {!currentUser && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg text-center">
                  <p>
                    Please{" "}
                    <Link
                      to="/login"
                      className="font-medium text-blue-600 hover:text-blue-800 underline"
                    >
                      login
                    </Link>{" "}
                    as a buyer to purchase this product
                  </p>
                </div>
              )}

              {currentUser && currentUser.role !== "BUYER" && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-center">
                  <p>Only buyers can purchase products</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
            {currentUser?.role === "BUYER" && !showReviewForm && !hasAlreadyReviewed && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Write a Review
              </button>
            )}
            {currentUser?.role === "BUYER" && hasAlreadyReviewed && (
              <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                You have already reviewed this product
              </span>
            )}
          </div>

          {/* Add Review Form */}
          {showReviewForm && currentUser?.role === "BUYER" && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Write Your Review</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="hover:scale-110 transition-transform focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300 hover:text-yellow-200"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {rating} star{rating !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Share your experience with this product..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {comment.length}/500 characters
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSubmitReview}
                  disabled={!comment.trim()}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Review
                </button>
                <button
                  onClick={() => {
                    setShowReviewForm(false);
                    setComment("");
                    setRating(5);
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Reviews List */}
          {isLoadingReviews ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No reviews yet</p>
              <p className="text-gray-400">Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-200 pb-6 last:border-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-gray-900">{review.buyerName}</span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}

          {/* Review Permission Messages */}
          {currentUser?.role === "SELLER" && !showReviewForm && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center mt-6">
              <p className="text-yellow-800">
                Sellers cannot review products. Switch to a buyer account to leave reviews.
              </p>
            </div>
          )}

          {currentUser?.role === "ADMIN" && !showReviewForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mt-6">
              <p className="text-blue-800">
                Admins cannot review products. This is for customer reviews only.
              </p>
            </div>
          )}

          {!currentUser && !showReviewForm && (
            <div className="bg-gray-50 rounded-lg p-4 text-center mt-6">
              <p className="text-gray-600">
                Please{" "}
                <Link
                  to="/login"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  login
                </Link>{" "}
                to write a review
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}