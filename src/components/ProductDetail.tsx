import { ArrowLeft, Package, ShoppingCart, Star } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner@2.0.3";
import { User } from "../App";
import { reviews as allReviews, products, sellers } from "../data/mockData";

interface ProductDetailProps {
  user: User | null;
  onAddToCart: (productId: string) => void;
}

export function ProductDetail({ user, onAddToCart }: ProductDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = products.find((p) => p.id === id);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-500">Product not found</p>
      </div>
    );
  }

  const seller = sellers.find((s) => s.id === product.sellerId);
  const productReviews = allReviews.filter((r) => r.productId === product.id);

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }
    if (user.type !== "buyer") {
      toast.error("Only buyers can add items to cart");
      return;
    }
    onAddToCart(product.id);
    toast.success("Added to cart!");
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to submit a review");
      navigate("/login");
      return;
    }
    if (user.type !== "buyer") {
      toast.error("Only buyers can submit reviews");
      return;
    }
    toast.success("Review submitted successfully!");
    setComment("");
    setRating(5);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
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
          />
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h1 className="text-gray-900 mb-2">{product.name}</h1>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="text-gray-700">{product.rating}</span>
            </div>
            <span className="text-gray-500">
              ({product.reviewCount} reviews)
            </span>
          </div>

          <p className="text-indigo-600 text-3xl mb-6">
            ${product.price.toFixed(2)}
          </p>

          <p className="text-gray-600 mb-6">{product.description}</p>

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 text-gray-700">
              <Package className="w-5 h-5 text-gray-400" />
              <span>Category: {product.category}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Package className="w-5 h-5 text-gray-400" />
              <span>Stock: {product.stock} available</span>
            </div>
          </div>

          {/* Seller Info */}
          {seller && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-600 text-sm mb-2">Sold by</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={seller.avatar}
                    alt={seller.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="text-gray-900">{seller.name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-gray-600 text-sm">
                        {seller.rating} seller rating
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </button>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-gray-900 mb-6">Customer Reviews</h2>

        {productReviews.length > 0 ? (
          <div className="space-y-6 mb-8">
            {productReviews.map((review) => (
              <div
                key={review.id}
                className="border-b border-gray-200 pb-6 last:border-b-0"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-gray-900">{review.buyerName}</p>
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
                <p className="text-gray-600">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mb-8">
            No reviews yet. Be the first to review this product!
          </p>
        )}

        {/* Add Review Form */}
        {user?.type === "buyer" && (
          <div>
            <h3 className="text-gray-900 mb-4">Write a Review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="comment" className="block text-gray-700 mb-2">
                  Your Review
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  placeholder="Share your experience with this product..."
                  required
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Submit Review
              </button>
            </form>
          </div>
        )}

        {!user && (
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-gray-600">
              Please{" "}
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-700"
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
