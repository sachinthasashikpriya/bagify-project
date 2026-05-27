import { useState, useEffect } from 'react';
import { Shield, Users, Package, TrendingUp, LogOut, AlertTriangle, Search, X, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProduct';
import type { UserProfileResponse, SellerVerificationResponse } from '../types';
import { userService } from '../services/userservice';
import { orderService, type OrderResponse } from '../services/orderService';
import { ConfirmModal } from './common/ConfirmModal';
import { adminService } from '../services/adminService';


export function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const { products, deleteProduct } = useProducts();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'users' | 'orders' | 'verifications'>('overview');
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [verifications, setVerifications] = useState<SellerVerificationResponse[]>([]);
  const [isLoadingVerifications, setIsLoadingVerifications] = useState(false);
  const [processingSellerId, setProcessingSellerId] = useState<number | null>(null);
  const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{
    isOpen: boolean;
    sellerId: number | null;
    rejectionReason: string;
    businessName: string;
    name: string;
  }>({
    isOpen: false,
    sellerId: null,
    rejectionReason: '',
    businessName: '',
    name: '',
  });
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

  const [users, setUsers] = useState<UserProfileResponse[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'BUYER' | 'SELLER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Client-side debounce for search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch users when tab changes to users or overview
  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'overview') {
      const fetchUsers = async () => {
        setIsLoadingUsers(true);
        const result = await userService.getAllUsers();
        if (result.ok && result.data) {
          setUsers(result.data);
        } else {
          toast.error(result.error || "Failed to load users");
        }
        setIsLoadingUsers(false);
      };
      fetchUsers();
    }
  }, [activeTab]);

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

  // Fetch verifications when tab changes to verifications
  const fetchVerifications = async () => {
    setIsLoadingVerifications(true);
    const result = await adminService.getPendingVerifications();
    if (result.ok && result.data) {
      setVerifications(result.data);
    } else {
      toast.error(result.error || "Failed to load verifications");
    }
    setIsLoadingVerifications(false);
  };

  useEffect(() => {
    if (activeTab === 'verifications') {
      fetchVerifications();
    }
  }, [activeTab]);

  const handleApproveVerification = (sellerId: number, sellerName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Approve Verification',
      message: `Approve ${sellerName}'s verification? They will receive a verified badge.`,
      isDestructive: false,
      onConfirm: async () => {
        setProcessingSellerId(sellerId);
        setProcessingAction('approve');
        try {
          const result = await adminService.approveVerification(sellerId);
          if (result.ok) {
            toast.success(`${sellerName} has been approved.`);
            setVerifications(prev => prev.filter(v => Number(v.id) !== sellerId));
          } else {
            toast.error(result.error || "Failed to approve seller");
          }
        } catch {
          toast.error("An error occurred during approval");
        } finally {
          setProcessingSellerId(null);
          setProcessingAction(null);
        }
      }
    });
  };

  const openRejectionModal = (sellerId: number, businessName: string, name: string) => {
    setRejectionModal({
      isOpen: true,
      sellerId,
      rejectionReason: '',
      businessName,
      name,
    });
  };

  const handleRejectVerification = async () => {
    const { sellerId, rejectionReason, name } = rejectionModal;
    if (!sellerId) return;
    if (rejectionReason.trim().length < 10) {
      toast.error("Please enter a rejection reason with at least 10 characters");
      return;
    }

    setProcessingSellerId(sellerId);
    setProcessingAction('reject');

    try {
      const result = await adminService.rejectVerification(sellerId, rejectionReason);
      if (result.ok) {
        toast.success(`${name}'s verification has been rejected.`);
        setVerifications(prev => prev.filter(v => Number(v.id) !== sellerId));
        setRejectionModal(prev => ({ ...prev, isOpen: false }));
      } else {
        toast.error(result.error || "Failed to reject seller");
      }
    } catch {
      toast.error("An error occurred during rejection");
    } finally {
      setProcessingSellerId(null);
      setProcessingAction(null);
    }
  };

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

  const handleToggleUserStatus = (user: UserProfileResponse) => {
    const isEnabling = !user.enabled;

    if (isEnabling) {
      // Toggle locally (optimistic update)
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, enabled: true } : u))
      );

      userService.enableUser(user.id).then((result) => {
        if (result.ok) {
          toast.success(`User ${user.name} has been enabled`);
        } else {
          // Rollback on failure
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, enabled: false } : u))
          );
          toast.error(result.error || `Failed to enable user ${user.name}`);
        }
      }).catch(() => {
        // Rollback on failure
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, enabled: false } : u))
        );
        toast.error(`An error occurred while enabling ${user.name}`);
      });
    } else {
      // Disable opens a ConfirmModal
      setConfirmModal({
        isOpen: true,
        title: 'Disable User Account',
        message: 'Are you sure? This user will lose access immediately.',
        isDestructive: true,
        onConfirm: () => {
          // Toggle locally (optimistic update)
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, enabled: false } : u))
          );
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));

          userService.disableUser(user.id).then((result) => {
            if (result.ok) {
              toast.success(`User ${user.name} has been disabled`);
            } else {
              // Rollback on failure
              setUsers((prev) =>
                prev.map((u) => (u.id === user.id ? { ...u, enabled: true } : u))
              );
              toast.error(result.error || `Failed to disable user ${user.name}`);
            }
          }).catch(() => {
            // Rollback on failure
            setUsers((prev) =>
              prev.map((u) => (u.id === user.id ? { ...u, enabled: true } : u))
            );
            toast.error(`An error occurred while disabling ${user.name}`);
          });
        },
      });
    }
  };

  // Client-side filtering logic
  const filteredUsers = users.filter((user) => {
    // Role filter
    if (roleFilter !== 'ALL' && user.role !== roleFilter) {
      return false;
    }
    // Search query filter (by name or email)
    if (debouncedSearchQuery.trim() !== '') {
      const query = debouncedSearchQuery.toLowerCase();
      const matchesName = user.name?.toLowerCase().includes(query);
      const matchesEmail = user.email?.toLowerCase().includes(query);
      return matchesName || matchesEmail;
    }
    return true;
  });

  // Calculate stats
  const totalProducts = products.length;
  const totalUsers = users.length;
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
              <button
                onClick={() => setActiveTab('verifications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'verifications'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Shield className="w-5 h-5 inline mr-2" />
                Verifications
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
                {/* Header Controls */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">User Management</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Monitor and manage registered buyers and sellers on the platform.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search Field */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                      />
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    </div>
                    {/* Role Filter */}
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as any)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="BUYER">Buyers Only</option>
                      <option value="SELLER">Sellers Only</option>
                    </select>
                  </div>
                </div>

                {isLoadingUsers ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 text-sm font-medium">Fetching registered users...</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="py-3.5 px-6 font-semibold text-xs text-gray-700 uppercase tracking-wider">Name</th>
                            <th className="py-3.5 px-6 font-semibold text-xs text-gray-700 uppercase tracking-wider">Email</th>
                            <th className="py-3.5 px-6 font-semibold text-xs text-gray-700 uppercase tracking-wider">Role</th>
                            <th className="py-3.5 px-6 font-semibold text-xs text-gray-700 uppercase tracking-wider">Status</th>
                            <th className="py-3.5 px-6 font-semibold text-xs text-gray-700 uppercase tracking-wider">Joined Date</th>
                            <th className="py-3.5 px-6 font-semibold text-xs text-gray-700 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-16 text-center text-gray-500">
                                <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                                  <Users className="w-12 h-12 text-gray-300" />
                                  <p className="text-base font-semibold text-gray-700">No users found</p>
                                  <p className="text-sm text-gray-500">
                                    {debouncedSearchQuery || roleFilter !== 'ALL'
                                      ? "We couldn't find any users matching your filter criteria. Try adjusting your search term."
                                      : 'There are currently no registered users on the platform.'}
                                  </p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map((user) => (
                              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-3">
                                    {user.profileImageUrl ? (
                                      <img
                                        src={user.profileImageUrl}
                                        alt={user.name}
                                        className="w-9 h-9 rounded-full object-cover border border-gray-200"
                                      />
                                    ) : (
                                      <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs border border-purple-100 shadow-sm">
                                        {user.name
                                          .split(' ')
                                          .map((n) => n[0])
                                          .join('')
                                          .toUpperCase()
                                          .slice(0, 2)}
                                      </div>
                                    )}
                                    <span className="font-semibold text-gray-900 text-sm">{user.name}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-600 font-medium">
                                  {user.email}
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${
                                    user.role === 'ADMIN'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : user.role === 'SELLER'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}>
                                    {user.role}
                                  </span>
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    user.enabled
                                      ? 'bg-green-50 text-green-700 border border-green-200'
                                      : 'bg-red-50 text-red-700 border border-red-200'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${user.enabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                    {user.enabled ? 'Enabled' : 'Disabled'}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-500 font-medium">
                                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  }) : 'N/A'}
                                </td>
                                <td className="py-4 px-6 text-sm font-medium">
                                  {String(user.id) === String(currentUser.id) ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed">
                                      You
                                    </span>
                                  ) : user.enabled ? (
                                    <button
                                      onClick={() => handleToggleUserStatus(user)}
                                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-sm hover:shadow transition-all duration-200"
                                    >
                                      Disable
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleToggleUserStatus(user)}
                                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-sm hover:shadow transition-all duration-200"
                                    >
                                      Enable
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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

            {/* Verifications Tab */}
            {activeTab === 'verifications' && (
              <div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Seller Verifications</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Review business documents and details for sellers requesting verification.
                    </p>
                  </div>
                </div>

                {isLoadingVerifications ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 text-sm font-medium">Fetching pending verification requests...</p>
                  </div>
                ) : verifications.length === 0 ? (
                  <div className="py-16 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto p-6">
                      <Shield className="w-12 h-12 text-gray-300 animate-pulse" />
                      <p className="text-base font-semibold text-gray-700">No pending verification requests.</p>
                      <p className="text-sm text-gray-500">
                        All registered sellers are either fully verified or reviewed.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {verifications.map((seller) => (
                      <div 
                        key={seller.id} 
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
                      >
                        {/* Body */}
                        <div className="p-5 space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900 text-base">{seller.name}</h4>
                              <p className="text-xs text-gray-500">{seller.email}</p>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                              PENDING
                            </span>
                          </div>

                          {/* Business Info */}
                          <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Business Name</p>
                              <p className="text-sm font-medium text-gray-800 truncate" title={seller.businessName}>{seller.businessName}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reg Number</p>
                              <p className="text-sm font-medium text-gray-800 truncate" title={seller.registrationNumber}>{seller.registrationNumber}</p>
                            </div>
                          </div>

                          {/* Submitted Date */}
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                            <span>Submitted:</span>
                            <span className="text-gray-700">
                              {seller.submittedAt ? new Date(seller.submittedAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'N/A'}
                            </span>
                          </div>

                          {/* Documents */}
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-2">Submitted Documents</p>
                            <div className="flex gap-4">
                              {seller.brCertificateUrl && (
                                <a 
                                  href={seller.brCertificateUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="group relative flex flex-col items-center justify-center w-32 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 hover:shadow-md hover:border-purple-300 transition-all duration-200"
                                >
                                  <FileText className="w-6 h-6 text-gray-400 mb-1 group-hover:text-purple-500 transition-colors" />
                                  <span className="text-[10px] text-gray-500 font-semibold group-hover:text-purple-600">BR Certificate</span>
                                  <img 
                                    src={seller.brCertificateUrl} 
                                    alt="BR Certificate" 
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).remove();
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                                    <span className="text-white text-[10px] font-semibold px-1.5 py-0.5 bg-black/60 rounded">View BR</span>
                                  </div>
                                </a>
                              )}
                              
                              {seller.nicImageUrl && (
                                <a 
                                  href={seller.nicImageUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="group relative flex flex-col items-center justify-center w-32 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 hover:shadow-md hover:border-purple-300 transition-all duration-200"
                                >
                                  <FileText className="w-6 h-6 text-gray-400 mb-1 group-hover:text-purple-500 transition-colors" />
                                  <span className="text-[10px] text-gray-500 font-semibold group-hover:text-purple-600">NIC Image</span>
                                  <img 
                                    src={seller.nicImageUrl} 
                                    alt="NIC Image" 
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).remove();
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                                    <span className="text-white text-[10px] font-semibold px-1.5 py-0.5 bg-black/60 rounded">View NIC</span>
                                  </div>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                          <button
                            type="button"
                            disabled={processingSellerId === Number(seller.id)}
                            onClick={() => openRejectionModal(Number(seller.id), seller.businessName, seller.name)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-sm hover:shadow transition-all duration-150 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingSellerId === Number(seller.id) && processingAction === 'reject' ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Rejecting...
                              </>
                            ) : (
                              'Reject'
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={processingSellerId === Number(seller.id)}
                            onClick={() => handleApproveVerification(Number(seller.id), seller.name)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-sm hover:shadow transition-all duration-150 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingSellerId === Number(seller.id) && processingAction === 'approve' ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Approving...
                              </>
                            ) : (
                              'Approve'
                            )}
                          </button>
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

      {/* Rejection Modal */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Reject Seller Verification</h3>
              <button 
                onClick={() => setRejectionModal(prev => ({ ...prev, isOpen: false }))}
                disabled={processingSellerId === rejectionModal.sellerId && processingAction === 'reject'}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600">
                  Rejecting verification request for <span className="font-semibold text-gray-900">{rejectionModal.name}</span> (<span className="font-medium text-gray-700">{rejectionModal.businessName}</span>).
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Please provide a detailed reason. This reason will be shown to the seller.
                </p>
              </div>

              <div>
                <label htmlFor="rejectionReason" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Rejection Reason
                </label>
                <textarea
                  id="rejectionReason"
                  rows={4}
                  disabled={processingSellerId === rejectionModal.sellerId && processingAction === 'reject'}
                  value={rejectionModal.rejectionReason}
                  onChange={(e) => setRejectionModal(prev => ({ ...prev, rejectionReason: e.target.value }))}
                  placeholder="e.g., BR Certificate document is expired, or NIC image is too blurry to read."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all shadow-sm disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                disabled={processingSellerId === rejectionModal.sellerId && processingAction === 'reject'}
                onClick={() => setRejectionModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejectionModal.rejectionReason.trim().length < 10 || (processingSellerId === rejectionModal.sellerId && processingAction === 'reject')}
                onClick={handleRejectVerification}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {processingSellerId === rejectionModal.sellerId && processingAction === 'reject' ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Rejecting...
                  </>
                ) : (
                  'Reject Request'
                )}
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