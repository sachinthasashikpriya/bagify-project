import { useState, useEffect } from 'react';
import { Shield, Users, Package, TrendingUp, LogOut, AlertTriangle, Search, Filter, Loader2, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProduct';
import { userService } from '../services/userservice';
import type { User } from '../types';

export function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const { products, deleteProduct } = useProducts();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'users'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'BUYER' | 'SELLER'>('ALL');

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
          const result = await userService.getAllUsers();
          if (result.ok && result.data) {
            setUsers(result.data);
          } else {
            toast.error(result.error || 'Failed to fetch users');
          }
        } catch (error) {
          toast.error('An error occurred while fetching users');
        } finally {
          setLoadingUsers(false);
        }
      };
      
      fetchUsers();
    }
  }, [currentUser]);

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
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
      toast.success('Logged out successfully');
    }
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      deleteProduct(productId);
      toast.success('Product deleted successfully');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus?: string) => {
    const isDisable = currentStatus !== 'DISABLED';
    const action = isDisable ? 'disable' : 'enable';
    
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        const result = isDisable 
          ? await userService.disableUser(userId)
          : await userService.enableUser(userId);
          
        if (result.ok) {
          toast.success(`User ${action}d successfully`);
          setUsers(prevUsers => 
            prevUsers.map(u => 
              u.id === userId 
                ? { ...u, status: isDisable ? 'DISABLED' : 'ENABLED' } 
                : u
            )
          );
        } else {
          toast.error(result.error || `Failed to ${action} user`);
        }
      } catch (error) {
        toast.error(`An error occurred while trying to ${action} the user`);
      }
    }
  };

  // Calculate stats
  const totalProducts = products.length;
  const totalUsers = users.length;
  const totalRevenue = products.reduce((sum, p) => {
    const soldQuantity = Math.max(0, 30 - p.stock);
    return sum + (p.price * soldQuantity);
  }, 0);
  const lowStockProducts = products.filter(p => p.stock < 5);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                          user.email.toLowerCase().includes(userSearchQuery.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || user.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {currentUser.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/verifications')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              <UserCheck className="w-5 h-5" />
              Seller Verifications
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full sm:w-64"
                      />
                    </div>
                    
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value as any)}
                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white w-full sm:w-40"
                      >
                        <option value="ALL">All Roles</option>
                        <option value="BUYER">Buyers</option>
                        <option value="SELLER">Sellers</option>
                        <option value="ADMIN">Admins</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {loadingUsers ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    <span className="ml-2 text-gray-600">Loading users...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="py-3 px-4 font-medium text-gray-700">Name</th>
                          <th className="py-3 px-4 font-medium text-gray-700">Email</th>
                          <th className="py-3 px-4 font-medium text-gray-700">Role</th>
                          <th className="py-3 px-4 font-medium text-gray-700">Status</th>
                          <th className="py-3 px-4 font-medium text-gray-700">Joined Date</th>
                          <th className="py-3 px-4 font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  {user.profileImage ? (
                                    <img src={user.profileImage} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                                      {user.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="font-medium text-gray-900">{user.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-600">{user.email}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                  user.role === 'SELLER' ? 'bg-blue-100 text-blue-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.status === 'DISABLED' ? 'bg-red-100 text-red-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {user.status || 'ENABLED'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="py-3 px-4">
                                {user.role !== 'ADMIN' && (
                                  <button
                                    onClick={() => handleToggleUserStatus(user.id, user.status)}
                                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                      user.status === 'DISABLED'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                                    }`}
                                  >
                                    {user.status === 'DISABLED' ? 'Enable' : 'Disable'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-500">
                              No users found matching your criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}