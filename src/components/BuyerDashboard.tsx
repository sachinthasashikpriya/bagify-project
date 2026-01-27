import { useState } from 'react';
import { ShoppingBag, Star, Package, User, LogOut, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useProducts } from '../hooks/useProduct';

export function BuyerDashboard() {  // ✅ Fixed: Changed from SellerDashboard to BuyerDashboard
  const { currentUser, logout } = useAuth();
  const { cartItems } = useCart();
  const { products } = useProducts();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'reviews'>('orders');

  // Check if user is a buyer (✅ Fixed: Changed from seller to buyer)
  if (!currentUser || currentUser.type !== 'buyer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-sm text-center max-w-md">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need to be logged in as a buyer to access this page.</p>
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

  // Mock orders (you can implement order context later)
  const mockOrders = [
    {
      id: 'order1',
      date: '2024-01-20',
      status: 'delivered',
      total: 89.99,
      items: [
        { productId: 'p1', name: 'Leather Handbag', price: 89.99, quantity: 1 }
      ]
    },
    {
      id: 'order2',
      date: '2024-01-18',
      status: 'shipped',
      total: 45.50,
      items: [
        { productId: 'p2', name: 'Canvas Backpack', price: 45.50, quantity: 1 }
      ]
    }
  ];

  // Mock wishlist (you can implement wishlist context later)
  const wishlistItems = products.slice(0, 3);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
      toast.success('Logged out successfully');
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const totalOrders = mockOrders.length;
  const totalSpent = mockOrders.reduce((sum, order) => sum + order.total, 0);
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
                <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
              </div>
              <Package className="w-12 h-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-gray-900">${totalSpent.toFixed(2)}</p>
              </div>
              <ShoppingBag className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Cart Items</p>
                <p className="text-3xl font-bold text-gray-900">{cartItemsCount}</p>
              </div>
              <ShoppingBag className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Wishlist</p>
                <p className="text-3xl font-bold text-gray-900">{wishlistItems.length}</p>
              </div>
              <Heart className="w-12 h-12 text-red-600" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => handleNavigate('/')}
              className="flex items-center gap-2 p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              Browse Products
            </button>
            <button
              onClick={() => handleNavigate('/cart')}
              className="flex items-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              View Cart
            </button>
            <button
              onClick={() => handleNavigate('/edit-profile')}
              className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <User className="w-5 h-5" />
              Edit Profile
            </button>
            <button
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
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="w-5 h-5 inline mr-2" />
                Recent Orders
              </button>
              <button
                onClick={() => setActiveTab('wishlist')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'wishlist'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Heart className="w-5 h-5 inline mr-2" />
                Wishlist
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reviews'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Star className="w-5 h-5 inline mr-2" />
                My Reviews
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
                {mockOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h4>
                    <p className="text-gray-500 mb-4">Start shopping to see your orders here!</p>
                    <button
                      onClick={() => handleNavigate('/')}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockOrders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-gray-900">Order #{order.id}</p>
                            <p className="text-sm text-gray-500">{order.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">${order.total.toFixed(2)}</p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'delivered' 
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'shipped'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="border-t pt-3">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-gray-600">{item.name} × {item.quantity}</span>
                              <span className="text-gray-900">${item.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Wishlist</h3>
                {wishlistItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No items in wishlist</h4>
                    <p className="text-gray-500 mb-4">Add products to your wishlist to see them here!</p>
                    <button
                      onClick={() => handleNavigate('/')}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlistItems.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-48 object-cover rounded mb-3"
                        />
                        <h4 className="font-medium text-gray-900 mb-2">{product.name}</h4>
                        <p className="text-purple-600 font-bold mb-3">${product.price.toFixed(2)}</p>
                        <button
                          onClick={() => handleNavigate(`/product/${product.id}`)}
                          className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          View Product
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">My Reviews</h3>
                <div className="text-center py-8">
                  <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h4>
                  <p className="text-gray-500 mb-4">Purchase products to leave reviews!</p>
                  <button
                    onClick={() => handleNavigate('/')}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}