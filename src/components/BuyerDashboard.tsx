import { Heart, LogOut, Package, ShoppingBag, Star, User, Loader2, Clock, Truck, CheckCircle2, X, Trash2, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { useProducts } from "../hooks/useProduct";
import { orderService, type OrderResponse } from "../services/orderService";
import { ConfirmModal } from "./common/ConfirmModal";
import { useWishlist } from "../hooks/useWishlist";
import { reviewService } from "../services/reviewService";
import { type Review } from "../types";

export function BuyerDashboard() {
  // ✅ Fixed: Changed from SellerDashboard to BuyerDashboard
  const { currentUser, logout } = useAuth();
  const { cartItems, addToCart, isLoadingCart } = useCart();
  const { products } = useProducts();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"orders" | "wishlist" | "reviews">(
    "orders"
  );



  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<OrderResponse | null>(null);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDestructive: true,
  });

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'SHIPPED': return 'bg-blue-100 text-blue-800';
      case 'PARTIALLY_SHIPPED': return 'bg-indigo-100 text-indigo-800';
      case 'PACKED': return 'bg-cyan-100 text-cyan-800';
      case 'PROCESSING': return 'bg-orange-100 text-orange-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'PENDING':
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'UNPAID':
      default: return 'bg-rose-100 text-rose-800';
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoadingOrders(true);
        const result = await orderService.getMyOrders();
        if (result.ok && result.data) {
          setOrders(result.data);
        } else {
          toast.error(result.error || "Failed to fetch orders");
        }
      } catch {
        toast.error("An error occurred while fetching orders");
      } finally {
        setIsLoadingOrders(false);
      }
    };

    if (currentUser?.role === "BUYER") {
      fetchOrders();
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoadingReviews(true);
        const data = await reviewService.getMyReviews();
        setMyReviews(data);
      } catch (error: any) {
        toast.error(error.message || "Failed to fetch reviews");
      } finally {
        setIsLoadingReviews(false);
      }
    };

    if (currentUser?.role === "BUYER" && activeTab === "reviews") {
      fetchReviews();
    }
  }, [currentUser, activeTab]);

  // Check if user is a buyer (✅ Fixed: Changed from seller to buyer)
  if (!currentUser || currentUser.role !== "BUYER") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-sm text-center max-w-md">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You need to be logged in as a buyer to access this page.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const { wishlistProducts: wishlistItems, removeFromWishlist, isLoadingWishlist } = useWishlist();

  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: "Confirm Logout",
      message: "Are you sure you want to logout?",
      onConfirm: () => {
        logout();
        navigate("/");
        toast.success("Logged out successfully");
      },
      isDestructive: true,
    });
  };

  const handleCancelOrder = (orderId: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Order',
      message: `Are you sure you want to cancel Order #${orderId}?`,
      onConfirm: async () => {
        try {
          const result = await orderService.cancelOrder(orderId);
          if (result.ok && result.data) {
            toast.success(`Order #${orderId} has been cancelled.`);
            setOrders(prev => prev.map(o => o.id === orderId ? result.data! : o));
          } else {
            toast.error(result.error || "Failed to cancel order");
          }
        } catch {
          toast.error("An error occurred while cancelling the order");
        }
      },
      isDestructive: true,
    });
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleAddToCart = async (product: any) => {
    try {
      await addToCart(product);
      toast.success("Added to cart");
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const cartItemsCount = cartItems.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {currentUser.name}!
            </h1>
            <p className="text-gray-600">Manage your orders and preferences</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Orders</p>
                {isLoadingOrders ? (
                  <div className="h-9 w-16 bg-gray-200 animate-pulse rounded-lg mt-1"></div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900">
                    {totalOrders}
                  </p>
                )}
              </div>
              <Package className="w-12 h-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Spent</p>
                {isLoadingOrders ? (
                  <div className="h-9 w-24 bg-gray-200 animate-pulse rounded-lg mt-1"></div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900">
                    ${totalSpent.toFixed(2)}
                  </p>
                )}
              </div>
              <ShoppingBag className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Cart Items</p>
                {isLoadingCart ? (
                  <div className="h-9 w-16 bg-gray-200 animate-pulse rounded-lg mt-1"></div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900">
                    {cartItemsCount}
                  </p>
                )}
              </div>
              <ShoppingBag className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Wishlist</p>
                {isLoadingWishlist ? (
                  <div className="h-9 w-16 bg-gray-200 animate-pulse rounded-lg mt-1"></div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900">
                    {wishlistItems.length}
                  </p>
                )}
              </div>
              <Heart className="w-12 h-12 text-red-600" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => handleNavigate("/")}
              className="flex items-center gap-2 p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              Browse Products
            </button>
            <button
              onClick={() => handleNavigate("/cart")}
              className="flex items-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              View Cart
            </button>
            <button
              onClick={() => handleNavigate("/edit-profile")}
              className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <User className="w-5 h-5" />
              Edit Profile
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className="flex items-center gap-2 p-4 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <Star className="w-5 h-5" />
              My Reviews
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("orders")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "orders"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Package className="w-5 h-5 inline mr-2" />
                Recent Orders
              </button>
              <button
                onClick={() => setActiveTab("wishlist")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "wishlist"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Heart className="w-5 h-5 inline mr-2" />
                Wishlist
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "reviews"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Star className="w-5 h-5 inline mr-2" />
                My Reviews
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Orders
                </h3>
                {isLoadingOrders ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading your orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      No orders yet
                    </h4>
                    <p className="text-gray-500 mb-4">
                      Start shopping to see your orders here!
                    </p>
                    <button
                      onClick={() => handleNavigate("/")}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const sortedOrders = [...orders].sort(
                        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                      );
                      const displayedOrders = showAllOrders ? sortedOrders : sortedOrders.slice(0, 5);
                      return (
                        <>
                          {displayedOrders.map((order) => (
                            <div
                              key={order.id}
                              className="border border-gray-200 rounded-lg overflow-hidden"
                            >
                              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                                <div>
                                  <p 
                                    onClick={() => navigate(`/orders/${order.id}/confirmation`)}
                                    className="font-semibold text-purple-600 hover:text-purple-800 hover:underline cursor-pointer transition-colors"
                                    title="View order details"
                                  >
                                    Order #{order.id}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-gray-900 mb-1">
                                    ${order.totalAmount.toFixed(2)}
                                  </p>
                                  <div className="flex gap-1.5 justify-end">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusColor(order.status)}`}
                                    >
                                      {order.status.replace(/_/g, ' ')}
                                    </span>
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${getPaymentStatusColor(order.paymentStatus)}`}
                                    >
                                      {order.paymentStatus}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Per-item status grouped by seller */}
                              <div className="divide-y divide-gray-100 bg-white">
                                {order.items.map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-gray-50/30 transition-colors duration-200"
                                  >
                                    {/* Left section: Thumbnail + Details */}
                                    <div className="flex items-center gap-4 min-w-0">
                                      {/* Thumbnail image wrapper */}
                                      <div
                                        onClick={() => navigate(`/product/${item.productId}`)}
                                        className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 cursor-pointer shadow-sm group/thumb relative"
                                        title="View Product"
                                      >
                                        <img
                                          src={item.imageUrl || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80"}
                                          alt={item.productName}
                                          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80';
                                          }}
                                        />
                                      </div>

                                      {/* Details */}
                                      <div className="min-w-0">
                                        <h4
                                          onClick={() => navigate(`/product/${item.productId}`)}
                                          className="font-semibold text-gray-900 hover:text-purple-600 transition-colors duration-200 cursor-pointer truncate text-base mb-1"
                                          title="View Product"
                                        >
                                          {item.productName}
                                        </h4>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                                          <span className="flex items-center gap-1">
                                            Qty: <span className="font-semibold text-gray-800">{item.quantity}</span>
                                          </span>
                                          <span className="text-gray-300">•</span>
                                          <span className="flex items-center gap-1">
                                            Price: <span className="font-semibold text-gray-800">${item.priceAtPurchase.toFixed(2)}</span>
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right section: Pricing & Actions */}
                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 flex-shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                      <div className="text-left sm:text-right">
                                        <p className="text-xs text-gray-400 sm:hidden">Item Total</p>
                                        <span className="font-bold text-gray-900 text-lg">
                                          ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                                        </span>
                                      </div>
                                      
                                      {item.itemStatus?.toUpperCase() === 'DELIVERED' && (
                                        <button
                                          onClick={() => navigate(`/product/${item.productId}`)}
                                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors duration-200 shadow-sm"
                                        >
                                          <Star className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
                                          Leave Review
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="px-4 py-3 border-t border-gray-100 bg-white flex justify-end gap-3">
                                {order.status === 'PENDING' && (
                                  <button
                                    onClick={() => handleCancelOrder(order.id)}
                                    className="text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 px-4 py-2 rounded-lg transition-colors"
                                  >
                                    Cancel Order
                                  </button>
                                )}
                                {order.status === 'PENDING' && order.paymentStatus === 'UNPAID' && (
                                  <button
                                    onClick={() => navigate(`/orders/${order.id}/confirmation`)}
                                    className="text-sm font-medium text-white hover:bg-purple-700 bg-purple-600 px-4 py-2 rounded-lg transition-colors shadow-sm"
                                  >
                                    Pay Now
                                  </button>
                                )}
                                <button
                                  onClick={() => setTrackingOrder(order)}
                                  className="text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 px-4 py-2 rounded-lg transition-colors"
                                >
                                  Track Order
                                </button>
                              </div>
                            </div>
                          ))}
                          {orders.length > 5 && (
                            <div className="mt-6 text-center">
                              <button
                                onClick={() => setShowAllOrders(!showAllOrders)}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium text-sm"
                              >
                                {showAllOrders ? (
                                  <>Show Less ←</>
                                ) : (
                                  <>View All Orders ({orders.length - 5} more) →</>
                                )}
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === "wishlist" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Wishlist
                </h3>
                {wishlistItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      No items in wishlist
                    </h4>
                    <p className="text-gray-500 mb-4">
                      Add products to your wishlist to see them here!
                    </p>
                    <button
                      onClick={() => handleNavigate("/")}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlistItems.map((product) => (
                      <div
                        key={product.id}
                        className="border border-gray-200 rounded-lg p-4 flex flex-col"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-48 object-cover rounded mb-3"
                        />
                        <h4 className="font-medium text-gray-900 mb-2">
                          {product.name}
                        </h4>
                        <p className="text-purple-600 font-bold mb-3">
                          ${product.price.toFixed(2)}
                        </p>
                        <div className="mt-auto space-y-2">
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Add to Cart
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleNavigate(`/product/${product.id}`)}
                              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => removeFromWishlist(Number(product.id))}
                              className="flex-none bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                              title="Remove from Wishlist"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  My Reviews
                </h3>
                {isLoadingReviews ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading your reviews...</p>
                  </div>
                ) : myReviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      No reviews yet
                    </h4>
                    <p className="text-gray-500 mb-4">
                      Purchase products to leave reviews!
                    </p>
                    <button
                      onClick={() => handleNavigate("/")}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myReviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row gap-4 hover:shadow-md hover:border-purple-200 transition-all duration-300 group"
                      >
                        {/* Thumbnail image link */}
                        <div
                          className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 cursor-pointer"
                          onClick={() => handleNavigate(`/product/${review.productId}`)}
                        >
                          <img
                            src={review.productImage || "https://images.unsplash.com/photo-1574365569389-a10d488ca3fb?q=80"}
                            alt={review.productName || "Product image"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            {/* Product name with link */}
                            <h4
                              onClick={() => handleNavigate(`/product/${review.productId}`)}
                              className="font-semibold text-gray-900 hover:text-purple-600 transition-colors duration-200 cursor-pointer text-lg mb-1 leading-snug"
                            >
                              {review.productName || "Product"}
                            </h4>

                            {/* Star Rating */}
                            <div className="flex items-center gap-0.5 mb-2.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-200"
                                  }`}
                                />
                              ))}
                            </div>

                            {/* Comment */}
                            <p className="text-gray-600 text-sm mb-3 italic leading-relaxed break-words bg-gray-50 p-3 rounded-lg border border-gray-50">
                              "{review.comment}"
                            </p>
                          </div>

                          {/* Date and actions */}
                          <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-2 border-t border-gray-50">
                            <span>
                              Reviewed on{" "}
                              {new Date(review.date).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                            <span
                              onClick={() => handleNavigate(`/product/${review.productId}`)}
                              className="text-purple-600 hover:text-purple-700 font-medium hover:underline cursor-pointer flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-200"
                            >
                              View Product &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tracking Modal */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Track Order</h3>
                <p className="text-sm text-gray-500">Order #{trackingOrder.id}</p>
              </div>
              <button
                onClick={() => setTrackingOrder(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-200"></div>

                {/* Step 1: Pending */}
                <div className="relative flex items-start gap-4 mb-8">
                  <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="pt-2">
                    <h4 className="font-semibold text-gray-900">Order Placed</h4>
                    <p className="text-sm text-gray-500">{new Date(trackingOrder.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Step 2: Shipped */}
                <div className="relative flex items-start gap-4 mb-8">
                  <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${
                    ['SHIPPED', 'DELIVERED'].includes(trackingOrder.status) ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="pt-2">
                    <h4 className={`font-semibold ${['SHIPPED', 'DELIVERED'].includes(trackingOrder.status) ? 'text-gray-900' : 'text-gray-400'}`}>Shipped</h4>
                    {['SHIPPED', 'DELIVERED'].includes(trackingOrder.status) && (
                      <p className="text-sm text-gray-500">Your order is on the way</p>
                    )}
                  </div>
                </div>

                {/* Step 3: Delivered */}
                <div className="relative flex items-start gap-4">
                  <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${
                    trackingOrder.status === 'DELIVERED' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="pt-2">
                    <h4 className={`font-semibold ${trackingOrder.status === 'DELIVERED' ? 'text-gray-900' : 'text-gray-400'}`}>Delivered</h4>
                    {trackingOrder.status === 'DELIVERED' && (
                      <p className="text-sm text-gray-500">Package has been delivered</p>
                    )}
                  </div>
                </div>
              </div>

              {trackingOrder.status === 'CANCELLED' && (
                <div className="mt-8 p-4 bg-red-50 rounded-lg flex items-start gap-3">
                  <div className="text-red-600 mt-0.5">
                    <X className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-red-800">Order Cancelled</h4>
                    <p className="text-sm text-red-600 mt-1">This order was cancelled and will not be delivered.</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
              <button
                onClick={() => setTrackingOrder(null)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
      />
    </div>
  );
}
