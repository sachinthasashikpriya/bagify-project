import { ArrowLeft, Package, ShoppingCart, Star, Store } from "lucide-react";
import { useState } from "react";
import { Product, User as UserType } from "../types";

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  onAddReview: (productId: string, rating: number, comment: string) => void;
  currentUser: UserType | null;
}

export function ProductDetailPage({
  product,
  onBack,
  onAddToCart,
  onAddReview,
  currentUser,
}: ProductDetailPageProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const handleSubmitReview = () => {
    if (comment.trim()) {
      onAddReview(product.id, rating, comment);
      setComment("");
      setRating(5);
      setShowReviewForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to products
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <img
              src={product.image}
              alt={product.name}
              className="w-full aspect-square object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h1 className="text-3xl text-gray-900 mb-4">{product.name}</h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="text-gray-900">
                  {product.averageRating > 0
                    ? product.averageRating.toFixed(1)
                    : "No ratings yet"}
                </span>
                <span className="text-gray-500">
                  ({product.reviews.length} reviews)
                </span>
              </div>
            </div>

            <div className="text-3xl text-purple-600 mb-6">
              ${product.price}
            </div>

            <p className="text-gray-700 mb-6">{product.description}</p>

            {/* Seller Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Store className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900">{product.sellerName}</span>
              </div>
              <div className="flex items-center gap-2 ml-8">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-gray-600">
                  Seller Rating: {product.sellerRating.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Stock Info */}
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">
                {product.stock > 0
                  ? `${product.stock} in stock`
                  : "Out of stock"}
              </span>
            </div>

            {/* Add to Cart Button */}
            {currentUser?.type === "buyer" && product.stock > 0 && (
              <button
                onClick={() => onAddToCart(product)}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
            )}

            {!currentUser && (
              <div className="bg-blue-50 text-blue-700 p-4 rounded-lg">
                Please login as a buyer to purchase this product
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl text-gray-900">Customer Reviews</h2>
            {currentUser?.type === "buyer" && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Write a Review
              </button>
            )}
          </div>

          {/* Add Review Form */}
          {showReviewForm && currentUser?.type === "buyer" && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg text-gray-900 mb-4">Write Your Review</h3>

              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-2">
                  Your Review
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Share your experience with this product..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSubmitReview}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                >
                  Submit Review
                </button>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Reviews List */}
          {product.reviews.length === 0 ? (
            <p className="text-gray-500">
              No reviews yet. Be the first to review this product!
            </p>
          ) : (
            <div className="space-y-4">
              {product.reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-200 pb-4 last:border-0"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-900">{review.buyerName}</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
