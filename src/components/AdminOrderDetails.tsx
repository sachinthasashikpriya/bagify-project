import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ArrowLeft, Shield, ShoppingBag, User, MapPin, Mail, 
  CreditCard, ChevronDown, Package, Clock, Store, Star
} from 'lucide-react';
import { orderService, type OrderResponse } from '../services/orderService';
import { userService } from '../services/userservice';
import { useProducts } from '../hooks/useProduct';

interface BuyerInfo {
  id: number;
  name: string;
  email: string;
  address: string;
}

interface SellerInfo {
  id: number;
  name: string;
  email: string;
  businessName: string;
  rating: number;
}

export function AdminOrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { products } = useProducts();

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [buyer, setBuyer] = useState<BuyerInfo | null>(null);
  const [sellers, setSellers] = useState<Record<string, SellerInfo>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllDetails = async () => {
      if (!orderId) return;
      setIsLoading(true);
      
      const orderResult = await orderService.getOrder(orderId);
      if (!orderResult.ok || !orderResult.data) {
        toast.error(orderResult.error || "Failed to load order details");
        setIsLoading(false);
        return;
      }
      
      const fetchedOrder = orderResult.data;
      setOrder(fetchedOrder);

      // Fetch buyer details
      if (fetchedOrder.buyerId) {
        const buyerResult = await userService.getBuyerById(fetchedOrder.buyerId);
        if (buyerResult.ok && buyerResult.data) {
          setBuyer(buyerResult.data);
        }
      }

      // Fetch unique sellers details
      const uniqueSellerIds = Array.from(new Set(fetchedOrder.items.map(item => item.sellerId)));
      const sellersMap: Record<string, SellerInfo> = {};
      
      await Promise.all(
        uniqueSellerIds.map(async (sellerId) => {
          if (!sellerId) return;
          const sellerResult = await userService.getSellerById(sellerId);
          if (sellerResult.ok && sellerResult.data) {
            sellersMap[sellerId] = sellerResult.data;
          }
        })
      );
      
      setSellers(sellersMap);
      setIsLoading(false);
    };

    fetchAllDetails();
  }, [orderId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    try {
      const result = await orderService.updateOrderStatus(order.id, newStatus);
      if (result.ok && result.data) {
        toast.success(`Order status updated to ${newStatus}`);
        setOrder(result.data);
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleItemStatusChange = async (itemId: number, newStatus: string) => {
    if (!order) return;
    try {
      const result = await orderService.updateItemStatusAdmin(order.id, itemId, newStatus);
      if (result.ok && result.data) {
        toast.success(`Item status updated to ${newStatus}`);
        setOrder(result.data);
      } else {
        toast.error(result.error || 'Failed to update item status');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED': return 'bg-green-50 text-green-700 border border-green-200';
      case 'SHIPPED': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'PARTIALLY_SHIPPED': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'PACKED': return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
      case 'PROCESSING': return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'CANCELLED': return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'PENDING':
      default: return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID': return 'bg-green-50 text-green-700 border border-green-200';
      case 'FAILED': return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'UNPAID':
      default: return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-500 font-semibold text-sm">Loading complete transaction ledger...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <Shield className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Order Not Found</h2>
        <p className="text-slate-500 max-w-sm mb-6">The requested order could not be retrieved. It may not exist or has been archived.</p>
        <button
          onClick={() => navigate('/admin-dashboard', { state: { activeTab: 'orders' } })}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/10 flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10 admin-panel">
      <div className="max-w-[1440px] mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin-dashboard', { state: { activeTab: 'orders' } })}
              className="p-3 bg-white border border-slate-100 hover:border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                <span>Admin Console</span>
                <span>/</span>
                <span>Order Ledger</span>
                <span>/</span>
                <span className="text-purple-600">#{order.id}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Transaction Details</h1>
            </div>
          </div>
          <div className="px-4 py-2 bg-purple-500/5 border border-purple-500/10 rounded-2xl text-xs font-extrabold text-purple-700 shadow-sm flex items-center gap-2 max-w-max self-start md:self-auto">
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></span>
            Super Admin Override Mode
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: ID & Timestamp */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Order ID</p>
              <p className="text-sm font-black text-slate-800">Order #{order.id}</p>
              <p className="text-xs font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Card 2: Consolidated Status */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Package className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Global Status</p>
              <div className="relative inline-block w-full">
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`appearance-none pl-2.5 pr-7 py-1 rounded-lg text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm cursor-pointer transition-all w-full max-w-max ${getStatusColor(order.status)}`}
                  title="Override entire order status"
                >
                  <option value="PENDING" className="bg-white text-slate-800">PENDING</option>
                  <option value="PROCESSING" className="bg-white text-slate-800">PROCESSING</option>
                  <option value="PARTIALLY_SHIPPED" className="bg-white text-slate-800">PARTIALLY SHIPPED</option>
                  <option value="SHIPPED" className="bg-white text-slate-800">SHIPPED</option>
                  <option value="DELIVERED" className="bg-white text-slate-800">DELIVERED</option>
                  <option value="CANCELLED" className="bg-white text-slate-800">CANCELLED</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-current opacity-70">
                  <ChevronDown className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Payment Status */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Ledger</p>
              <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider border ${getPaymentStatusColor(order.paymentStatus)}`}>
                {order.paymentStatus}
              </span>
              {order.paymentId && (
                <p className="text-xs font-bold text-slate-400 mt-1 truncate max-w-[150px]" title={order.paymentId}>
                  ID: {order.paymentId}
                </p>
              )}
            </div>
          </div>

          {/* Card 4: Total Amount */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <span className="font-extrabold text-lg">Rs.</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Gross Total</p>
              <p className="text-base font-black text-slate-800">
                Rs. {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

        </div>

        {/* Double Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Columns (Span 2): Products */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-500" />
                  Order Line Items
                </h3>
                <span className="px-2.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold">
                  {order.items.length} items listed
                </span>
              </div>
              
              <div className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div key={item.id} className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      
                      {/* Product details */}
                      <div className="flex items-start gap-4">
                        <img
                          src={item.imageUrl || products.find(p => String(p.id) === String(item.productId))?.image || 'https://via.placeholder.com/80?text=No+Image'}
                          alt={item.productName}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-100 shadow-sm flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image';
                          }}
                        />
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm mb-1 hover:text-purple-600 transition-colors cursor-pointer" onClick={() => navigate(`/product/${item.productId}`)}>
                            {item.productName}
                          </h4>
                          <p className="text-slate-400 font-bold text-xs">
                            Product ID: #{item.productId}
                          </p>
                          <p className="text-slate-400 font-bold text-xs mt-0.5">
                            Unit Price: Rs. {item.priceAtPurchase.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      {/* Quantity & Total */}
                      <div className="text-right sm:self-start">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qty</p>
                        <p className="text-sm font-black text-slate-800 mt-0.5">{item.quantity}</p>
                        <p className="text-xs font-bold text-slate-500 mt-1">
                          Subtotal: Rs. {(item.priceAtPurchase * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                    </div>

                    {/* Merchant & Status footer */}
                    <div className="bg-slate-50 border border-slate-100/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-slate-600">
                      
                      {/* Seller Reference */}
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-slate-400" />
                        <span>
                          Fulfillment Merchant: <span className="font-extrabold text-slate-800">#{item.sellerId || 'N/A'}</span>
                        </span>
                        {item.sellerId ? (
                          sellers[item.sellerId] ? (
                            <span className="text-xs text-purple-600 font-extrabold">
                              ({sellers[item.sellerId].businessName || sellers[item.sellerId].name})
                            </span>
                          ) : (
                            <span className="text-xs text-rose-500 font-extrabold">
                              (Seller not found)
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-rose-500 font-extrabold">
                            (No Seller Assigned)
                          </span>
                        )}
                      </div>


                      {/* Item Status drop down */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-slate-400 font-medium">Item Status:</span>
                        <div className="relative inline-block">
                          <select
                            value={item.itemStatus}
                            onChange={(e) => handleItemStatusChange(item.id, e.target.value)}
                            className={`appearance-none pl-2.5 pr-7 py-1 rounded-lg text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm cursor-pointer transition-all ${getStatusColor(item.itemStatus)}`}
                          >
                            <option value="PENDING" className="bg-white text-slate-800">PENDING</option>
                            <option value="PROCESSING" className="bg-white text-slate-800">PROCESSING</option>
                            <option value="PACKED" className="bg-white text-slate-800">PACKED</option>
                            <option value="SHIPPED" className="bg-white text-slate-800">SHIPPED</option>
                            <option value="DELIVERED" className="bg-white text-slate-800">DELIVERED</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-current opacity-70">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: People details */}
          <div className="space-y-6">
            
            {/* Buyer Card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="w-5 h-5 text-purple-500" />
                Buyer Information
              </h3>
              
              {buyer ? (
                <div className="space-y-4 text-xs font-bold">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-sm border border-purple-100 shadow-sm">
                      {buyer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{buyer.name}</p>
                      <p className="text-xs font-bold text-slate-400">Account ID: #{buyer.id}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-100/50">
                    <div className="flex items-center gap-2 text-slate-500 font-bold">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-700 truncate">{buyer.email}</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-500 font-bold">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div className="text-slate-700">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Shipping Destination</p>
                        <p className="leading-relaxed font-semibold">{order.shippingAddress || buyer.address || 'No Address Provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-rose-500 text-xs font-semibold py-4 text-center bg-rose-50 rounded-xl border border-rose-100">
                  Buyer Account Not Found (ID: #{order.buyerId})
                </div>
              )}
            </div>

            {/* Sellers Card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Store className="w-5 h-5 text-purple-500" />
                Fulfilling Sellers
              </h3>
              
              <div className="space-y-4">
                {Object.values(sellers).length === 0 ? (
                  <div className="text-slate-400 text-xs font-semibold py-4 text-center">
                    No assigned sellers found
                  </div>
                ) : (
                  Object.values(sellers).map((seller) => (
                    <div key={seller.id} className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs border border-indigo-100">
                            {seller.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800">{seller.name}</p>
                            <p className="text-xs text-slate-400">ID: #{seller.id}</p>
                          </div>
                        </div>
                        {seller.rating > 0 && (
                          <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-md text-xs font-extrabold">
                            <Star className="w-3 h-3 fill-amber-500 stroke-amber-500" />
                            {seller.rating.toFixed(1)}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100/50 text-xs font-semibold text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Store Name:</span>
                          <span className="text-slate-700 font-bold">{seller.businessName || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Email:</span>
                          <span className="text-slate-700 truncate">{seller.email}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
