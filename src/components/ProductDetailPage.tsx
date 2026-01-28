import { ArrowLeft, Package, ShoppingCart, Star, Store } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { useProducts } from "../hooks/useProduct";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const { products, addReview } = useProducts();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const product = products.find((p) => p.id === id);

  if (!product) {
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

  const handleAddToCart = () => {
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

    addToCart(product);
    toast.success("Added to cart!");
  };

  const handleSubmitReview = () => {
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

    addReview(product.id, rating, comment.trim(), currentUser.id, currentUser.name);
    toast.success("Review submitted successfully!");
    setComment("");
    setRating(5);
    setShowReviewForm(false);
  };

  const averageRating = product.reviews.length > 0 
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length 
    : 0;

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
                  ({product.reviews.length} reviews)
                </span>
              </div>
            </div>

            <div className="text-3xl font-bold text-purple-600 mb-6">
              ${product.price.toFixed(2)}
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
                  <p className="font-medium text-gray-900">
                    {product.sellerName || "BagMarket Store"}
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
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || !currentUser || currentUser.role !== "BUYER"}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
              >
                <ShoppingCart className="w-5 h-5" />
                {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
              </button>

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
            {currentUser?.role === "BUYER" && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Write a Review
              </button>
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
          {product.reviews.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No reviews yet</p>
              <p className="text-gray-400">Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {product.reviews.map((review) => (
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