import { ArrowLeft, Package, ShoppingCart, Star, Store } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { useProducts } from "../hooks/useProduct";

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const { products, addReview } = useProducts();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
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

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();

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

    addReview(
      product.id,
      rating,
      comment.trim(),
      currentUser.id,
      currentUser.name
    );
    toast.success("Review submitted successfully!");
    setComment("");
    setRating(5);
  };

  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
        product.reviews.length
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-96 lg:h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://via.placeholder.com/400x400?text=No+Image';
            }}
          />
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {product.name}
          </h1>

          <div className="flex items-center gap-2 mb-4">
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
              <span className="text-gray-700 ml-2">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-gray-500">
              ({product.reviews.length} reviews)
            </span>
          </div>

          <p className="text-purple-600 text-3xl font-bold mb-6">
            ${product.price.toFixed(2)}
          </p>

          <p className="text-gray-600 mb-6 leading-relaxed">
            {product.description}
          </p>

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 text-gray-700">
              <Package className="w-5 h-5 text-gray-400" />
              <span>
                Category:{" "}
                <span className="font-medium capitalize">
                  {product.category}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Package className="w-5 h-5 text-gray-400" />
              <span>
                Stock:
                <span
                  className={`font-medium ml-1 ${
                    product.stock > 10
                      ? "text-green-600"
                      : product.stock > 0
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {product.stock > 0
                    ? `${product.stock} available`
                    : "Out of stock"}
                </span>
              </span>
            </div>
          </div>

          {/* Seller Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-gray-600 text-sm mb-2">Sold by</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Store className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {product.sellerName || "BagMarket Store"}
                  </p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-gray-600 text-sm">
                      {product.sellerRating?.toFixed(1) || "4.5"} seller rating
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={
              product.stock <= 0 || !currentUser || currentUser.role !== "BUYER"
            }
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
          >
            <ShoppingCart className="w-5 h-5" />
            {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
          </button>

          {!currentUser && (
            <p className="text-center text-sm text-gray-600 mt-3">
              <Link
                to="/login"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Login
              </Link>{" "}
              to add items to cart
            </p>
          )}

          {currentUser && currentUser.role !== "BUYER" && (
            <p className="text-center text-sm text-yellow-600 mt-3">
              Only buyers can add items to cart
            </p>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Customer Reviews
        </h2>

        {product.reviews.length > 0 ? (
          <div className="space-y-6 mb-8">
            {product.reviews.map((review) => (
              <div
                key={review.id}
                className="border-b border-gray-200 pb-6 last:border-b-0"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">
                      {review.buyerName}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-gray-500 text-sm">{review.date}</span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mb-8 text-center py-8">
            No reviews yet. Be the first to review this product!
          </p>
        )}

        {/* Add Review Form */}
        {currentUser?.role === "BUYER" && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Write a Review
            </h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
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
                        className={`w-6 h-6 ${
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
              <div>
                <label
                  htmlFor="comment"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Your Review
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
                  placeholder="Share your experience with this product..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {comment.length}/500 characters
                </p>
              </div>
              <button
                type="submit"
                disabled={!comment.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Review
              </button>
            </form>
          </div>
        )}

        {currentUser?.role === "SELLER" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800">
              Sellers cannot review products. Switch to a buyer account to leave
              reviews.
            </p>
          </div>
        )}

        {currentUser?.role === "ADMIN" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800">
              Admins cannot review products. This is for customer reviews only.
            </p>
          </div>
        )}

        {!currentUser && (
          <div className="bg-gray-50 rounded-lg p-4 text-center">
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
  );
}