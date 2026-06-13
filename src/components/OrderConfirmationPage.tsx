import { CheckCircle2, ChevronRight, Package, MapPin, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { orderService, type OrderResponse } from "../services/orderService";
import { useAuth } from "../hooks/useAuth";
import { useProducts } from "../hooks/useProduct";
import { toast } from "sonner";
import { env } from "../config/env";

export function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { refreshProducts } = useProducts();
  const [isPaying, setIsPaying] = useState(false);

  async function fetchOrderDetails() {
    if (!orderId) return;
    try {
      const result = await orderService.getOrder(orderId);
      if (result.ok && result.data) {
        setOrder(result.data);
      }
    } catch (err) {
      console.error("Failed to refresh order details:", err);
    }
  }

  const handlePay = async () => {
    if (!orderId || !currentUser || !order) return;

    const payhere = (window as any).payhere;
    if (!payhere) {
      toast.error("PayHere SDK is not loaded yet. Please wait a few seconds and try again.");
      return;
    }

    setIsPaying(true);
    try {
      const returnUrl = `${window.location.origin}/orders/${orderId}/confirmation`;
      const cancelUrl = window.location.href;
      const result = await orderService.getPaymentParams(orderId, returnUrl, cancelUrl);
      if (!result.ok || !result.data) {
        toast.error(result.error || "Failed to fetch payment parameters");
        setIsPaying(false);
        return;
      }

      const payment = result.data;

      payhere.onCompleted = function (_completedOrderId: string) {
        toast.success("Payment successful! Thank you.");
        
        // 1. Optimistic UI update for immediate visual satisfaction
        setOrder(prev => {
          if (!prev) return null;
          return {
            ...prev,
            paymentStatus: "PAID",
            status: "PROCESSING"
          };
        });

        // 2. Immediately trigger refreshing global products stock cache
        refreshProducts().catch(err => console.error("Failed to refresh stock:", err));

        // 3. Poll the backend details a few times in case webhook is slightly delayed
        let attempts = 0;
        const pollInterval = setInterval(async () => {
          attempts++;
          await fetchOrderDetails();
          if (attempts >= 6) {
            clearInterval(pollInterval);
          }
        }, 1500);
      };

      payhere.onDismissed = function () {
        toast.warning("Payment dismissed.");
      };

      payhere.onError = function (error: string) {
        toast.error("Payment error: " + error);
      };

      payhere.startPayment(payment);
    } catch (err: any) {
      toast.error(err.message || "Checkout failed");
    } finally {
      setIsPaying(false);
    }
  };

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      try {
        setLoading(true);
        const result = await orderService.getOrder(orderId);
        if (result.ok && result.data) {
          setOrder(result.data);
        } else {
          setError(result.error || "Failed to load order details");
        }
      } catch (err: any) {
        if (err.response && err.response.status === 403) {
          setError("You do not have permission to view this order.");
        } else {
          setError(err.message || "Failed to load order details");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-sm text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "Could not find the requested order."}</p>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Calculate estimated delivery (e.g., 3-5 days from order creation)
  const orderDate = new Date(order.createdAt);
  const estimatedDeliveryStart = new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000);
  const estimatedDeliveryEnd = new Date(orderDate.getTime() + 5 * 24 * 60 * 60 * 1000);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'SHIPPED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'PENDING':
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Success Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-lg text-gray-600 mb-6">
            Thank you for your purchase. We've received your order and are getting it ready.
          </p>
          <div className="inline-flex items-center space-x-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-medium">
            <Package className="w-5 h-5" />
            <span>Order #{order.id}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
            
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-gray-900">
                    Rs. {(item.priceAtPurchase * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total Amount</span>
                <span>Rs. {order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping & Delivery Info */}
          <div className="space-y-8">
            {/* PayHere Checkout Card */}
            {order.paymentStatus === 'UNPAID' && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                      <span className="font-semibold text-lg">💳</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Payment Required</h2>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                    UNPAID
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-5 leading-relaxed">
                  Please complete the payment of <span className="font-bold text-purple-600">Rs. {order.totalAmount.toFixed(2)}</span> to complete your checkout and begin order processing.
                </p>
                <button
                  onClick={handlePay}
                  disabled={isPaying}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-200 disabled:opacity-50"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading PayHere Sandbox...
                    </>
                  ) : (
                    "Pay Now with PayHere"
                  )}
                </button>
              </div>
            )}

            {order.paymentStatus === 'PAID' && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Payment Received</h2>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                    PAID
                  </span>
                </div>
                <p className="text-gray-600 text-sm mt-4">
                  Thank you! Your payment was verified successfully. Reference ID: <span className="font-mono text-xs bg-gray-100 p-1 rounded select-all">{order.paymentId || "PAYHERE_REF"}</span>
                </p>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <Package className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Estimated Delivery</h2>
              </div>
              <p className="text-gray-600">
                {formatDate(estimatedDeliveryStart)} - {formatDate(estimatedDeliveryEnd)}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <MapPin className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
              </div>
              <p className="text-gray-600 whitespace-pre-line">
                {order.shippingAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            to="/"
            className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            to="/buyer-dashboard"
            className="inline-flex justify-center items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-xl text-white bg-purple-600 hover:bg-purple-700 transition-colors gap-2"
          >
            View All Orders
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
