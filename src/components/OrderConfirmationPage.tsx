import { CheckCircle2, ChevronRight, Package, MapPin, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { orderService, type OrderResponse } from "../services/orderService";

export function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      try {
        setLoading(true);
        const result = await orderService.getOrder(orderId);
        if (result.ok && result.data) {
          setOrder(result.data);
        } else {
          setError(result.error?.message || "Failed to load order details");
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
                    ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total Amount</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping & Delivery Info */}
          <div className="space-y-8">
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
