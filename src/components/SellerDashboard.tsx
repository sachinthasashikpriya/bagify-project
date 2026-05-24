import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Star, Package, TrendingUp, LogOut, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProduct';
import { orderService, type OrderResponse, type OrderItemResponse } from '../services/orderService';

export function SellerDashboard() {
  const { currentUser, logout } = useAuth();
  const { products, addProduct, deleteProduct } = useProducts();
  const navigate = useNavigate();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    stock: '',
  });

  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    if (activeTab === 'orders') {
      const fetchOrders = async () => {
        setIsLoadingOrders(true);
        const result = await orderService.getSellerOrders();
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

  const handleItemStatusChange = async (orderId: number, itemId: number, newStatus: string) => {
    try {
      const result = await orderService.updateItemStatus(orderId, itemId, newStatus);
      if (result.ok && result.data) {
        toast.success(`Item status updated to ${newStatus}`);
        // Replace the updated order in state (backend returns full updated order)
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

  // For seller-owned items: get only items that belong to this seller
  const getSellerItems = (order: OrderResponse): OrderItemResponse[] =>
    order.items.filter(item => item.sellerId === currentSellerId);

  // Check if user is a seller
  if (!currentUser || currentUser.role !== 'SELLER') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-sm text-center max-w-md">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need to be logged in as a seller to access this page.</p>
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

  // ✅ FIX 1: Convert currentUser.id to string for comparison
  const currentSellerId = String(currentUser.id);

  // ✅ FIX 2: Define sellerProducts - filter products for current seller
  const sellerProducts = products.filter(p => p.sellerId === currentSellerId);
  
  // Calculate seller stats
  const totalRevenue = sellerProducts.reduce((sum, p) => {
    const soldQuantity = Math.max(0, 30 - p.stock); // Assuming initial stock was 30
    return sum + (p.price * soldQuantity);
  }, 0);
  
  const totalSold = sellerProducts.reduce((sum, p) => {
    const soldQuantity = Math.max(0, 30 - p.stock);
    return sum + soldQuantity;
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Product description is required');
      return;
    }
    if (!formData.category.trim()) {
      toast.error('Product category is required');
      return;
    }
    if (parseFloat(formData.price) <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }
    if (parseInt(formData.stock) < 0) {
      toast.error('Stock cannot be negative');
      return;
    }
    if (!formData.image.trim()) {
      toast.error('Product image URL is required');
      return;
    }

    // ✅ FIX 3: Add product with ALL required seller info
    addProduct({
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      category: formData.category.trim(),
      image: formData.image.trim(),
      stock: parseInt(formData.stock),
      sellerId: currentSellerId,
      sellerName: currentUser.name,
      sellerRating: 4.5, // Default seller rating
    });

    // Reset form and close modal
    setFormData({ 
      name: '', 
      description: '', 
      price: '', 
      category: '', 
      image: '', 
      stock: '' 
    });
    setShowAddForm(false);
    toast.success('Product added successfully!');
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      deleteProduct(productId);
      toast.success('Product deleted successfully');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
      toast.success('Logged out successfully');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Mock seller rating
  const sellerRating = 4.5;
  const totalReviews = sellerProducts.reduce((sum, p) => sum + p.reviews.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              {currentUser.name}'s Store
              {currentUser.verification?.status === 'APPROVED' && (
                <BadgeCheck className="w-8 h-8 text-green-500" title="Verified Seller" />
              )}
            </h1>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="text-gray-700">{sellerRating.toFixed(1)} rating</span>
              <span className="text-gray-500">({totalReviews} reviews)</span>
            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">{sellerProducts.length}</p>
              </div>
              <Package className="w-12 h-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Items Sold</p>
                <p className="text-3xl font-bold text-gray-900">{totalSold}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
              </div>
              <Star className="w-12 h-12 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Package className="w-5 h-5" />
              View Store
            </button>
            <button
              onClick={() => navigate('/edit-profile')}
              className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Edit className="w-5 h-5" />
              Edit Profile
            </button>
            <button
              className="flex items-center gap-2 p-4 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <Star className="w-5 h-5" />
              View Analytics
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
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
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="w-5 h-5 inline mr-2" />
                Orders
              </button>
            </nav>
          </div>
        </div>

        {/* Products Section */}
        {activeTab === 'products' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Products</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          </div>

          {/* Add Product Form */}
          {showAddForm && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Product</h3>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    {/* ✅ FIX 4: Updated category options to match mock data */}
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      <option value="Tote Bags">Tote Bags</option>
                      <option value="Backpacks">Backpacks</option>
                      <option value="Crossbody Bags">Crossbody Bags</option>
                      <option value="Briefcases">Briefcases</option>
                      <option value="Duffle Bags">Duffle Bags</option>
                      <option value="Clutches">Clutches</option>
                      <option value="Messenger Bags">Messenger Bags</option>
                      <option value="Gym Bags">Gym Bags</option>
                      <option value="Handbags">Handbags</option>
                      <option value="Laptop Bags">Laptop Bags</option>
                      <option value="Travel Bags">Travel Bags</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter stock quantity"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: Use images from Unsplash (e.g., https://images.unsplash.com/photo-xxx?w=400)
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Describe your product..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Add Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Stock</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Rating</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellerProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/48x48?text=No+Image';
                          }}
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
                        product.stock > 10 ? 'text-green-600' : 
                        product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-gray-700">
                          {product.averageRating > 0 ? product.averageRating.toFixed(1) : 'N/A'}
                        </span>
                        <span className="text-gray-500 text-sm">
                          ({product.reviews.length})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => navigate(`/product/${product.id}`)}
                          className="p-2 hover:bg-gray-100 rounded transition-colors"
                          title="View Product"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="p-2 hover:bg-gray-100 rounded transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sellerProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-500 mb-4">Add your first product to get started!</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Your First Product
                </button>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Orders Section — Hybrid per-item model */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
              <p className="text-sm text-gray-500 mt-1">
                You can update the status of your own items. The overall order status is derived automatically.
              </p>
            </div>
            {isLoadingOrders ? (
              <div className="text-center py-8 text-gray-500">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No orders found.</div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => {
                  const myItems = getSellerItems(order);
                  if (myItems.length === 0) return null;
                  return (
                    <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Order header */}
                      <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-gray-900">Order #{order.id}</span>
                          <span className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                          <span className="text-sm text-gray-500">Buyer #{order.buyerId}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">Order total: <span className="font-medium text-gray-800">${order.totalAmount.toFixed(2)}</span></span>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* My items in this order */}
                      <div className="divide-y divide-gray-100">
                        {myItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-4">
                              {item.imageUrl && (
                                <img
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  className="w-12 h-12 rounded-lg object-cover border border-gray-100"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <div>
                                <p className="font-medium text-gray-900">{item.productName}</p>
                                <p className="text-sm text-gray-500">Qty: {item.quantity} × ${item.priceAtPurchase.toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.itemStatus)}`}>
                                {item.itemStatus}
                              </span>
                              {/* Seller controls: PENDING → PROCESSING → PACKED → SHIPPED */}
                              {order.status !== 'CANCELLED' && item.itemStatus !== 'DELIVERED' && (
                                <select
                                  value={item.itemStatus}
                                  onChange={(e) => handleItemStatusChange(order.id, item.id, e.target.value)}
                                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-purple-500 bg-white"
                                >
                                  <option value="PENDING">PENDING</option>
                                  <option value="PROCESSING">PROCESSING</option>
                                  <option value="PACKED">PACKED</option>
                                  <option value="SHIPPED">SHIPPED</option>
                                </select>
                              )}
                              {item.itemStatus === 'DELIVERED' && (
                                <span className="text-xs text-green-600 font-medium">✓ Delivered</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}