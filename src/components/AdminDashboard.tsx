import { useState, useEffect } from 'react';
import { Shield, Users, Package, TrendingUp, LogOut, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProduct';
import { mockBuyers, mockSellers } from '../types';
import { orderService, type OrderResponse } from '../services/orderService';
import { ConfirmModal } from './common/ConfirmModal';

export function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const { products, deleteProduct } = useProducts();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'users' | 'orders'>('overview');
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
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

  // Fetch orders when tab changes to orders
  useEffect(() => {
    if (activeTab === 'orders') {
      const fetchOrders = async () => {
        setIsLoadingOrders(true);
        const result = await orderService.getAllOrders();
        if (result.ok && result.data) {
          setOrders(result.data);
        } else {
          toast.error(result.error || "Failed to load orders");
        }
        setIsLoadingOrders(false);
      };
      fetchOrders();
    }
  }, [activeTab]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const result = await orderService.updateOrderStatus(orderId, newStatus);
      if (result.ok && result.data) {
        toast.success(`Order #${orderId} status updated to ${newStatus}`);
        setOrders(orders.map(o => o.id === orderId ? result.data! : o));
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleItemStatusChange = async (orderId: number, itemId: number, newStatus: string) => {
    try {
      const result = await orderService.updateItemStatusAdmin(orderId, itemId, newStatus);
      if (result.ok && result.data) {
        toast.success(`Item status updated to ${newStatus}`);
        setOrders(prev => prev.map(o => o.id === result.data!.id ? result.data! : o));
      } else {
        toast.error(result.error || 'Failed to update item status');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

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

  // Check if user is an admin
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-sm text-center max-w-md">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need to be logged in as an admin to access this page.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      onConfirm: () => {
        logout();
        navigate('/');
        toast.success('Logged out successfully');
      },
      isDestructive: true,
    });
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Product',
      message: `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
      onConfirm: () => {
        deleteProduct(productId);
        toast.success('Product deleted successfully');
      },
      isDestructive: true,
    });
  };

  // Calculate stats
  const totalProducts = products.length;
  const totalUsers = mockBuyers.length + mockSellers.length;
  const totalRevenue = products.reduce((sum, p) => {
    const soldQuantity = Math.max(0, 30 - p.stock);
    return sum + (p.price * soldQuantity);
  }, 0);
  const lowStockProducts = products.filter(p => p.stock < 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {currentUser.name}</p>
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
                <p className="text-gray-600 mb-1">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
              </div>
              <Package className="w-12 h-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
              </div>
              <Users className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Low Stock Alert</p>
                <p className="text-3xl font-bold text-gray-900">{lowStockProducts.length}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
          </div>
        </div>

        {/* Alerts */}
        {lowStockProducts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-medium text-red-800">Low Stock Alert</h3>
            </div>
            <p className="text-red-700 text-sm">
              {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} running low on stock (less than 5 items).
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="w-5 h-5 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="w-5 h-5 inline mr-2" />
                Products
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-5 h-5 inline mr-2" />
                Users
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="w-5 h-5 inline mr-2" />
                Orders
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Overview</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Activity */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600">• 5 new products added today</p>
                      <p className="text-gray-600">• 12 new user registrations</p>
                      <p className="text-gray-600">• 8 orders completed</p>
                      <p className="text-gray-600">• {lowStockProducts.length} products need restocking</p>
                    </div>
                  </div>

                  {/* Top Categories */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Popular Categories</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Handbags</span>
                        <span className="font-medium">
                          {products.filter(p => p.category === 'handbags').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Backpacks</span>
                        <span className="font-medium">
                          {products.filter(p => p.category === 'backpacks').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Clutches</span>
                        <span className="font-medium">
                          {products.filter(p => p.category === 'clutches').length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Management</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Price</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Stock</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Seller</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{product.name}</p>
                                <p className="text-sm text-gray-500 truncate max-w-xs">
                                  {product.description}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="capitalize text-gray-700">{product.category}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900">${product.price.toFixed(2)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-medium ${
                              product.stock < 5 ? 'text-red-600' : 
                              product.stock < 10 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-700">{product.sellerName || 'Unknown'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Buyers */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Buyers ({mockBuyers.length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {mockBuyers.map((buyer) => (
                        <div key={buyer.id} className="bg-gray-50 rounded-lg p-3">
                          <p className="font-medium text-gray-900">{buyer.name}</p>
                          <p className="text-sm text-gray-600">{buyer.email}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sellers */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Sellers ({mockSellers.length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {mockSellers.map((seller) => (
                        <div key={seller.id} className="bg-gray-50 rounded-lg p-3">
                          <p className="font-medium text-gray-900">{seller.storeName}</p>
                          <p className="text-sm text-gray-600">{seller.email}</p>
                          <p className="text-sm text-gray-500">{seller.address}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Order Management</h3>
                  <p className="text-sm text-gray-500 mt-1">As admin you can update any item status including marking as DELIVERED.</p>
                </div>
                {isLoadingOrders ? (
                  <div className="text-center py-8 text-gray-500">Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No orders found.</div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Order header */}
                        <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-gray-900">Order #{order.id}</span>
                            <span className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                            <span className="text-sm text-gray-500">Buyer #{order.buyerId}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">Total: <span className="font-medium text-gray-800">${order.totalAmount.toFixed(2)}</span></span>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status.replace(/_/g, ' ')}
                            </span>
                            {/* Admin global override */}
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-purple-500 bg-white"
                              title="Global order status override"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="PROCESSING">PROCESSING</option>
                              <option value="PARTIALLY_SHIPPED">PARTIALLY_SHIPPED</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </div>
                        </div>

                        {/* Per-item status with admin controls */}
                        <div className="divide-y divide-gray-100">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between px-5 py-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                                <p className="text-xs text-gray-500">Qty: {item.quantity} · Seller #{item.sellerId} · ${(item.priceAtPurchase * item.quantity).toFixed(2)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.itemStatus)}`}>
                                  {item.itemStatus}
                                </span>
                                <select
                                  value={item.itemStatus}
                                  onChange={(e) => handleItemStatusChange(order.id, item.id, e.target.value)}
                                  className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-purple-500 bg-white"
                                >
                                  <option value="PENDING">PENDING</option>
                                  <option value="PROCESSING">PROCESSING</option>
                                  <option value="PACKED">PACKED</option>
                                  <option value="SHIPPED">SHIPPED</option>
                                  <option value="DELIVERED">DELIVERED</option>
                                </select>
                              </div>
                            </div>
                          ))}
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