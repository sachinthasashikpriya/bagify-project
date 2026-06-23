import { useState, useEffect } from 'react';
import { Shield, Users, Package, TrendingUp, AlertTriangle, Search, X, FileText, CheckCircle2, ShoppingBag, ArrowUpRight, ChevronDown, Calendar, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProduct';
import type { UserProfileResponse, SellerVerificationResponse } from '../types';
import { userService } from '../services/userservice';
import { orderService, type OrderResponse } from '../services/orderService';
import { ConfirmModal } from './common/ConfirmModal';
import { adminService } from '../services/adminService';

export function AdminDashboard() {
  const { currentUser } = useAuth();
  const { products, deleteProduct } = useProducts();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'users' | 'orders' | 'verifications'>(
    (location.state?.activeTab as 'overview' | 'products' | 'users' | 'orders' | 'verifications') || 'overview'
  );
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Order filter states
  const [orderFilterType, setOrderFilterType] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [orderStartDate, setOrderStartDate] = useState<string>('');
  const [orderEndDate, setOrderEndDate] = useState<string>('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'PARTIALLY_SHIPPED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Filtered orders logic
  const filteredOrders = orders.filter(order => {
    // 1. Search filter
    if (orderSearchQuery) {
      const q = orderSearchQuery.toLowerCase();
      const matchesOrderId = String(order.id).includes(q);
      const matchesBuyerId = String(order.buyerId).includes(q);
      const matchesProductName = order.items.some(item => 
        item.productName.toLowerCase().includes(q)
      );
      if (!matchesOrderId && !matchesBuyerId && !matchesProductName) {
        return false;
      }
    }

    // 2. Status filter
    if (orderStatusFilter !== 'ALL') {
      if (order.status !== orderStatusFilter) {
        return false;
      }
    }

    // 3. Date range filter
    if (!order.createdAt) return true;
    const orderDate = new Date(order.createdAt);
    const now = new Date();

    switch (orderFilterType) {
      case 'today': {
        return orderDate.toDateString() === now.toDateString();
      }
      case '7days': {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return orderDate.getTime() >= sevenDaysAgo.getTime();
      }
      case '30days': {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return orderDate.getTime() >= thirtyDaysAgo.getTime();
      }
      case 'custom': {
        if (orderStartDate) {
          const [year, month, day] = orderStartDate.split('-').map(Number);
          const start = new Date(year, month - 1, day, 0, 0, 0, 0);
          if (orderDate.getTime() < start.getTime()) {
            return false;
          }
        }
        if (orderEndDate) {
          const [year, month, day] = orderEndDate.split('-').map(Number);
          const end = new Date(year, month - 1, day, 23, 59, 59, 999);
          if (orderDate.getTime() > end.getTime()) {
            return false;
          }
        }
        return true;
      }
      case 'all':
      default:
        return true;
    }
  });
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
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, enabled: true } : u))
      );

      userService.enableUser(user.id).then((result) => {
        if (result.ok) {
          toast.success(`User ${user.name} has been enabled`);
        } else {
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, enabled: false } : u))
          );
          toast.error(result.error || `Failed to enable user ${user.name}`);
        }
      }).catch(() => {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, enabled: false } : u))
        );
        toast.error(`An error occurred while enabling ${user.name}`);
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: 'Disable User Account',
        message: 'Are you sure? This user will lose access immediately.',
        isDestructive: true,
        onConfirm: () => {
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, enabled: false } : u))
          );
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));

          userService.disableUser(user.id).then((result) => {
            if (result.ok) {
              toast.success(`User ${user.name} has been disabled`);
            } else {
              setUsers((prev) =>
                prev.map((u) => (u.id === user.id ? { ...u, enabled: true } : u))
              );
              toast.error(result.error || `Failed to disable user ${user.name}`);
            }
          }).catch(() => {
            setUsers((prev) =>
              prev.map((u) => (u.id === user.id ? { ...u, enabled: true } : u))
            );
            toast.error(`An error occurred while disabling ${user.name}`);
          });
        },
      });
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

  // Client-side filtering logic
  const filteredUsers = users.filter((user) => {
    if (roleFilter !== 'ALL' && user.role !== roleFilter) {
      return false;
    }
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

  const tabs: { id: 'overview' | 'products' | 'users' | 'orders' | 'verifications'; label: string; icon: typeof TrendingUp }[] = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'verifications', label: 'Verifications', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex admin-panel">
      {/* Sidebar Navigation */}
      <aside className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 shadow-xl transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div>
          {/* Logo Brand */}
          <div className="p-6 flex items-center justify-between border-b border-slate-800 bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400 shadow-inner">
                <Shield className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="font-extrabold text-white tracking-wider text-lg">BAGIFY</span>
                <span className="text-xs block text-purple-400 font-bold uppercase tracking-widest mt-0.5">Admin Central</span>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close sidebar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Summary */}
          <div className="p-5 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-sm shadow-md shadow-purple-500/20">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-white text-sm truncate">{currentUser.name}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 mt-1 uppercase">
                  Super Admin
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 translate-x-1'
                      : 'hover:bg-slate-800/60 hover:text-white hover:translate-x-1 text-slate-400'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {tab.label}
                  {tab.id === 'verifications' && verifications.length > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-extrabold bg-rose-500 text-white rounded-full animate-bounce">
                      {verifications.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>


      </aside>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Main Workspace */}
      <main className="flex-1 min-w-0 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-8 py-5 sticky top-0 z-10 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                <span>Admin Console</span>
                <span>/</span>
                <span className="text-purple-600 capitalize">{activeTab}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800">
                {activeTab === 'overview' && 'System Analytics Overview'}
                {activeTab === 'products' && 'Product Inventory Hub'}
                {activeTab === 'users' && 'Account Directory & Security'}
                {activeTab === 'orders' && 'Global Transaction Board'}
                {activeTab === 'verifications' && 'Seller Document Desk'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-xs text-slate-400 font-semibold">Active Session</p>
              <p className="text-sm font-bold text-slate-700">{currentUser.email}</p>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-8 flex-1">
          {/* Dashboard Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Card 1 */}
            <div className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Products</p>
                  <p className="text-3xl font-black text-slate-800 tracking-tight">{totalProducts}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-2xl text-purple-600 group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Registered Users</p>
                  <p className="text-3xl font-black text-slate-800 tracking-tight">{totalUsers}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gross Revenue</p>
                  <p className="text-3xl font-black text-emerald-600 tracking-tight">Rs. {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Low Stock Alerts</p>
                  <p className="text-3xl font-black text-slate-800 tracking-tight">
                    <span className={lowStockProducts.length > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}>
                      {lowStockProducts.length}
                    </span>
                  </p>
                </div>
                <div className={`p-3 rounded-2xl group-hover:scale-110 transition-transform ${lowStockProducts.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Alerts Banner */}
          {lowStockProducts.length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 rounded-2xl p-4 mb-8 flex items-center justify-between shadow-sm shadow-red-500/5 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl text-red-600 shadow-inner">
                  <AlertTriangle className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-bold text-red-950 text-sm">Low Stock Alert</h3>
                  <p className="text-red-700 text-xs mt-0.5 font-medium">
                    {lowStockProducts.length} critical inventory items have fallen below 5 units.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('products')}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow shadow-red-600/10 flex items-center gap-1.5"
              >
                Restock Inventory
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Main workspace section */}
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Visual Category Distribution */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-extrabold text-slate-800">Popular Categories</h3>
                    <span className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-md uppercase">
                      Stock Count
                    </span>
                  </div>
                  <div className="space-y-5">
                    {['handbags', 'backpacks', 'clutches'].map((cat) => {
                      const count = products.filter(p => p.category === cat).length;
                      const percentage = totalProducts > 0 ? (count / totalProducts) * 100 : 0;
                      let barColor = 'from-purple-500 to-indigo-500 bg-purple-500';
                      if (cat === 'backpacks') barColor = 'from-blue-500 to-cyan-500 bg-blue-500';
                      if (cat === 'clutches') barColor = 'from-emerald-500 to-teal-500 bg-emerald-500';

                      return (
                        <div key={cat} className="space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="capitalize text-slate-700">{cat}</span>
                            <span className="text-slate-500">{count} products ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                            <div 
                              className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-1000`} 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Timeline activity list */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="text-base font-extrabold text-slate-800 mb-6">Platform Activity Timeline</h3>
                  <div className="space-y-5 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                    {[
                      { text: 'New products added to marketplace listings', count: '5 items', dot: 'bg-purple-500' },
                      { text: 'New buyer and seller profiles created', count: '12 accounts', dot: 'bg-blue-500' },
                      { text: 'Completed buyer checkouts recorded', count: '8 checkouts', dot: 'bg-emerald-500' },
                      { text: 'Products flagged for stock restock', count: `${lowStockProducts.length} warnings`, dot: 'bg-rose-500' }
                    ].map((act, i) => (
                      <div key={i} className="flex gap-4 relative pl-8 text-xs font-bold">
                        <span className={`absolute left-[9px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white ${act.dot}`}></span>
                        <div className="flex-1 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-3 rounded-xl transition-all flex items-center justify-between">
                          <span className="text-slate-600 font-semibold">{act.text}</span>
                          <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-md text-xs">{act.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-800">Inventory Catalog</h3>
                  <span className="text-xs font-bold text-slate-500">{totalProducts} active items</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <th className="py-3.5 px-6">Product Details</th>
                        <th className="py-3.5 px-6">Category</th>
                        <th className="py-3.5 px-6">Price</th>
                        <th className="py-3.5 px-6">Stock Status</th>
                        <th className="py-3.5 px-6">Merchant</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-slate-400 font-medium">
                            No products available in database.
                          </td>
                        </tr>
                      ) : (
                        products.map((product) => {
                          const isLowStock = product.stock < 5;
                          const isOutOfStock = product.stock <= 0;
                          return (
                            <tr key={product.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image';
                                    }}
                                  />
                                  <div className="max-w-xs">
                                    <p className="font-extrabold text-slate-800 text-sm leading-tight mb-1">{product.name}</p>
                                    <p className="text-slate-400 font-medium truncate text-xs" title={product.description}>
                                      {product.description}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className="capitalize px-2.5 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-bold text-xs">
                                  {product.category}
                                </span>
                              </td>
                              <td className="py-4 px-6 font-extrabold text-slate-800 text-sm">
                                Rs. {product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg font-bold text-xs ${
                                  isOutOfStock
                                    ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                    : isLowStock
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                                  }`}></span>
                                  {product.stock} units
                                </span>
                              </td>
                              <td className="py-4 px-6 text-slate-700 font-bold">
                                {product.sellerName || 'Unknown Merchant'}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button
                                  onClick={() => handleDeleteProduct(product.id, product.name)}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-lg text-rose-600 text-xs font-bold transition-all border border-rose-100"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Control bar */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Search by username or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all shadow-inner"
                    />
                    <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex gap-3">
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'BUYER' | 'SELLER')}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all shadow-sm"
                    >
                      <option value="ALL">All Accounts</option>
                      <option value="BUYER">Buyers Only</option>
                      <option value="SELLER">Sellers Only</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-widest">
                          <th className="py-3.5 px-6">User Account</th>
                          <th className="py-3.5 px-6">Email Address</th>
                          <th className="py-3.5 px-6">Platform Role</th>
                          <th className="py-3.5 px-6">Account Status</th>
                          <th className="py-3.5 px-6">Verification</th>
                          <th className="py-3.5 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                        {isLoadingUsers ? (
                          <tr>
                            <td colSpan={6} className="py-16 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-slate-400 font-medium">Fetching accounts database...</span>
                              </div>
                            </td>
                          </tr>
                        ) : filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-16 text-center text-slate-400 font-medium">
                              No matching user records discovered.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  {user.profileImageUrl ? (
                                    <img
                                      src={user.profileImageUrl}
                                      alt={user.name}
                                      className="w-9 h-9 rounded-xl object-cover border border-slate-100 shadow-inner"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xs border border-purple-100 shadow-sm">
                                      {user.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="font-extrabold text-slate-800 text-sm">{user.name}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-slate-500 font-bold">{user.email}</td>
                              <td className="py-4 px-6">
                                <div className="flex flex-col gap-1">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider w-fit ${
                                    user.role === 'ADMIN'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                      : user.role === 'SELLER'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                      : 'bg-blue-50 text-blue-700 border border-blue-100'
                                  }`}>
                                    {user.role}
                                  </span>
                                  {user.role === 'SELLER' && (user.itemsSold !== undefined || user.revenue !== undefined) && (
                                    <span className="text-xs text-slate-400 font-extrabold leading-none mt-0.5">
                                      {user.itemsSold || 0} sold · Rs. {(user.revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg font-bold text-xs ${
                                  user.enabled
                                    ? 'bg-green-50 text-green-700 border border-green-100'
                                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${user.enabled ? 'bg-green-500 animate-pulse' : 'bg-rose-500'}`}></span>
                                  {user.enabled ? 'Active' : 'Disabled'}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                {user.role !== 'SELLER' ? (
                                  <span className="text-slate-300 font-bold">-</span>
                                ) : (
                                  (() => {
                                    const status = user.verificationStatus || 'NONE';
                                    switch (status) {
                                      case 'APPROVED':
                                        return (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            Verified
                                          </span>
                                        );
                                      case 'PENDING':
                                        return (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                                            Pending Approval
                                          </span>
                                        );
                                      case 'REJECTED':
                                        return (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                            Rejected
                                          </span>
                                        );
                                      case 'NONE':
                                      default:
                                        return (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-50 text-slate-400 border border-slate-200">
                                            Unverified
                                          </span>
                                        );
                                    }
                                  })()
                                )}
                              </td>
                              <td className="py-4 px-6 text-right">
                                {String(user.id) === String(currentUser.id) ? (
                                  <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-400 text-xs font-bold">
                                    You
                                  </span>
                                ) : user.enabled ? (
                                  <button
                                    onClick={() => handleToggleUserStatus(user)}
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-lg text-rose-600 text-xs font-bold transition-all border border-rose-100"
                                  >
                                    Disable
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleUserStatus(user)}
                                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-500 hover:text-white rounded-lg text-emerald-600 text-xs font-bold transition-all border border-emerald-100"
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
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-extrabold text-slate-800">Global Customer Transactions</h3>
                  <span className="text-xs font-bold text-slate-500">{filteredOrders.length} of {orders.length} order entries</span>
                </div>
                {isLoadingOrders ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-400 font-medium">Fetching transactions database...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-100 shadow-sm">
                    No order records found.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Filters Section */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Search Bar */}
                        <div className="relative flex-1">
                          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search by Order ID, Buyer ID, or Bag Name..."
                            value={orderSearchQuery}
                            onChange={(e) => setOrderSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-200/50 rounded-xl focus:outline-none transition-all duration-200 text-xs font-semibold"
                          />
                          {orderSearchQuery && (
                            <button
                              onClick={() => setOrderSearchQuery('')}
                              className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Status Dropdown */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status:</span>
                          <select
                            value={orderStatusFilter}
                            onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-200/50 focus:border-purple-500 transition-all cursor-pointer"
                          >
                            <option value="ALL">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="PARTIALLY_SHIPPED">Partially Shipped</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {/* Time Range Selector */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-slate-100/85">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-purple-600" />
                            Time Period:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { id: 'all', label: 'All Time' },
                              { id: 'today', label: 'Today' },
                              { id: '7days', label: 'Last 7 Days' },
                              { id: '30days', label: 'Last 30 Days' },
                              { id: 'custom', label: 'Custom Range' },
                            ].map((period) => (
                              <button
                                key={period.id}
                                onClick={() => {
                                  setOrderFilterType(period.id as any);
                                  if (period.id !== 'custom') {
                                    setOrderStartDate('');
                                    setOrderEndDate('');
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 border cursor-pointer ${
                                  orderFilterType === period.id
                                    ? 'bg-purple-600 border-purple-600 text-white shadow-sm shadow-purple-500/10'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50/10'
                                }`}
                              >
                                {period.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {orderFilterType === 'custom' && (
                          <div className="flex flex-wrap items-center gap-2.5 animate-in fade-in duration-200">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-400 font-bold">From</span>
                              <input
                                type="date"
                                value={orderStartDate}
                                onChange={(e) => setOrderStartDate(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-400 font-bold">To</span>
                              <input
                                type="date"
                                value={orderEndDate}
                                onChange={(e) => setOrderEndDate(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {filteredOrders.length === 0 ? (
                      <div className="py-16 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 border border-slate-100 shadow-inner">
                          <Calendar className="w-8 h-8 text-purple-500 animate-pulse" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-0.5">No Orders Found</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          No order records match your current filter settings. Try clearing or relaxing your search query or filters.
                        </p>
                        <button
                          onClick={() => {
                            setOrderFilterType('all');
                            setOrderStartDate('');
                            setOrderEndDate('');
                            setOrderStatusFilter('ALL');
                            setOrderSearchQuery('');
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all duration-200 shadow-sm cursor-pointer"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    ) : (
                      filteredOrders.map((order) => (
                        <div key={order.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {/* Header banner */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-6 py-4 bg-slate-50/50 border-b border-slate-100 text-xs font-bold">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="text-slate-800 text-sm font-black">Order #{order.id}</span>
                            <span className="text-slate-400">{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            <span className="text-slate-400">Buyer ID: #{order.buyerId}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-slate-500 font-bold">Gross Total: <span className="font-extrabold text-slate-800">Rs. {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                            <div className="relative inline-block">
                              <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                className={`appearance-none pl-2.5 pr-7 py-1 rounded-lg text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm cursor-pointer transition-all ${getStatusColor(order.status)}`}
                                title="Override entire order status"
                              >
                                <option value="PENDING" className="bg-white text-slate-800">PENDING</option>
                                <option value="PROCESSING" className="bg-white text-slate-800">PROCESSING</option>
                                <option value="PARTIALLY_SHIPPED" className="bg-white text-slate-800">PARTIALLY SHIPPED</option>
                                <option value="SHIPPED" className="bg-white text-slate-800">SHIPPED</option>
                                <option value="DELIVERED" className="bg-white text-slate-800">DELIVERED</option>
                                <option value="CANCELLED" className="bg-white text-slate-800">CANCELLED</option>
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-current opacity-70">
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </div>
                            <button
                              onClick={() => navigate(`/admin/orders/${order.id}`)}
                              className="px-3 py-1 bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 rounded-lg text-xs font-extrabold transition-all border border-purple-100 flex items-center gap-1 cursor-pointer"
                            >
                              <span>View Details</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="divide-y divide-slate-100">
                          {order.items.map((item) => (
                             <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 text-xs font-bold">
                               <div className="flex items-center gap-3">
                                 <img
                                   src={item.imageUrl || products.find(p => String(p.id) === String(item.productId))?.image || 'https://via.placeholder.com/80?text=No+Image'}
                                   alt={item.productName}
                                   className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm flex-shrink-0"
                                   onError={(e) => {
                                     (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image';
                                   }}
                                 />
                                 <div>
                                   <p className="font-extrabold text-slate-800 text-sm mb-1">{item.productName}</p>
                                   <p className="text-slate-400 font-medium text-xs">
                                     Qty: {item.quantity} · Merchant: #{item.sellerId} · Unit: Rs. {item.priceAtPurchase.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                   </p>
                                 </div>
                               </div>
                              <div className="flex items-center gap-3 self-end sm:self-auto">
                                <div className="relative inline-block">
                                  <select
                                    value={item.itemStatus}
                                    onChange={(e) => handleItemStatusChange(order.id, item.id, e.target.value)}
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
                          ))}
                        </div>
                      </div>
                    )))}
                  </div>
                )}
              </div>
            )}

            {/* Verifications Tab */}
            {activeTab === 'verifications' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="mb-4">
                  <h3 className="text-base font-extrabold text-slate-800">Merchant Credentials & Verifications</h3>
                  <p className="text-slate-400 text-xs mt-0.5 font-medium">Verify documents, credentials, and legal details submitted by marketplace vendors.</p>
                </div>

                {isLoadingVerifications ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-400 font-medium">Loading credentials queue...</span>
                  </div>
                ) : verifications.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-3">
                    <div className="p-3 bg-purple-50 rounded-full text-purple-400 border border-purple-100 shadow-inner">
                      <Shield className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold text-sm">Verification Queue Empty</p>
                      <p className="text-slate-400 text-xs mt-0.5 max-w-xs font-semibold">All vendor credentials are fully evaluated. No outstanding requests.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {verifications.map((seller) => (
                      <div 
                        key={seller.id} 
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
                      >
                        {/* Body */}
                        <div className="p-6 space-y-5 text-xs font-bold">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-extrabold text-slate-800 text-sm leading-tight mb-0.5">{seller.name}</h4>
                              <p className="text-slate-400 font-bold text-xs">{seller.email}</p>
                            </div>
                            <span className="inline-flex px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                              Awaiting Review
                            </span>
                          </div>

                          {/* Business Info Grid */}
                          <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Company Name</p>
                              <p className="text-xs font-extrabold text-slate-700 truncate" title={seller.businessName}>{seller.businessName}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Registration No.</p>
                              <p className="text-xs font-extrabold text-slate-700 truncate" title={seller.registrationNumber}>{seller.registrationNumber}</p>
                            </div>
                          </div>

                          {/* Submission Date */}
                          <div className="text-slate-400 font-bold text-xs flex items-center gap-1.5">
                            <span>Request Submitted:</span>
                            <span className="text-slate-700 font-extrabold">
                              {seller.submittedAt ? new Date(seller.submittedAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'N/A'}
                            </span>
                          </div>

                          {/* Document Attachments */}
                          <div className="space-y-2">
                            <p className="text-slate-700 font-bold text-xs">Credential Proofs</p>
                            <div className="flex gap-4">
                              {seller.brCertificateUrl && (
                                <a 
                                  href={seller.brCertificateUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="group relative flex flex-col items-center justify-center w-32 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:shadow-md hover:border-purple-300 transition-all duration-200"
                                >
                                  <FileText className="w-6 h-6 text-slate-400 mb-1 group-hover:text-purple-500 transition-colors" />
                                  <span className="text-xs text-slate-500 font-semibold group-hover:text-purple-600">BR Certificate</span>
                                  <img 
                                    src={seller.brCertificateUrl} 
                                    alt="BR Certificate" 
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).remove();
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                                    <span className="text-white text-xs font-bold px-2 py-0.5 bg-black/40 border border-white/10 rounded-md">Expand Proof</span>
                                  </div>
                                </a>
                              )}
                              
                              {seller.nicImageUrl && (
                                <a 
                                  href={seller.nicImageUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="group relative flex flex-col items-center justify-center w-32 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:shadow-md hover:border-purple-300 transition-all duration-200"
                                >
                                  <FileText className="w-6 h-6 text-slate-400 mb-1 group-hover:text-purple-500 transition-colors" />
                                  <span className="text-xs text-slate-500 font-semibold group-hover:text-purple-600">NIC Proof</span>
                                  <img 
                                    src={seller.nicImageUrl} 
                                    alt="NIC Image" 
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).remove();
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                                    <span className="text-white text-xs font-bold px-2 py-0.5 bg-black/40 border border-white/10 rounded-md">Expand Proof</span>
                                  </div>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer Action buttons */}
                        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                          <button
                            type="button"
                            disabled={processingSellerId === Number(seller.id)}
                            onClick={() => openRejectionModal(Number(seller.id), seller.businessName, seller.name)}
                            className="px-4 py-2 text-xs font-bold rounded-xl text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {processingSellerId === Number(seller.id) && processingAction === 'reject' ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                Rejecting...
                              </>
                            ) : (
                              'Reject Request'
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={processingSellerId === Number(seller.id)}
                            onClick={() => handleApproveVerification(Number(seller.id), seller.name)}
                            className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-emerald-50 to-green-600 hover:from-emerald-600 hover:to-green-700 transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-emerald-500/10"
                          >
                            {processingSellerId === Number(seller.id) && processingAction === 'approve' ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Approving...
                              </>
                            ) : (
                              'Approve Credentials'
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
      </main>

      {/* Rejection Modal */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-extrabold text-slate-800">Reject Verification Request</h3>
              <button 
                onClick={() => setRejectionModal(prev => ({ ...prev, isOpen: false }))}
                disabled={processingSellerId === rejectionModal.sellerId && processingAction === 'reject'}
                className="p-1.5 hover:bg-slate-200/50 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs font-bold">
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-700 leading-relaxed font-semibold">
                Rejecting request for <span className="font-extrabold text-slate-900">{rejectionModal.name}</span> of <span className="font-extrabold text-slate-900">{rejectionModal.businessName}</span>.
                <p className="text-xs text-rose-500 font-bold mt-1">Sellers will receive this description in their workspace to corrective re-upload docs.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="rejectionReason" className="block text-slate-700 font-bold uppercase tracking-wider text-xs">
                  Reason for rejection
                </label>
                <textarea
                  id="rejectionReason"
                  rows={4}
                  disabled={processingSellerId === rejectionModal.sellerId && processingAction === 'reject'}
                  value={rejectionModal.rejectionReason}
                  onChange={(e) => setRejectionModal(prev => ({ ...prev, rejectionReason: e.target.value }))}
                  placeholder="e.g., BR Certificate document is expired, or NIC image is too blurry to read."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all shadow-inner disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                disabled={processingSellerId === rejectionModal.sellerId && processingAction === 'reject'}
                onClick={() => setRejectionModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4.5 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel Review
              </button>
              <button
                type="button"
                disabled={rejectionModal.rejectionReason.trim().length < 10 || (processingSellerId === rejectionModal.sellerId && processingAction === 'reject')}
                onClick={handleRejectVerification}
                className="px-4.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-600/10 disabled:opacity-50 flex items-center gap-1.5"
              >
                {processingSellerId === rejectionModal.sellerId && processingAction === 'reject' ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Rejecting...
                  </>
                ) : (
                  'Confirm Rejection'
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