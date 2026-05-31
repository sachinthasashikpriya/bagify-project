import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Star, Package, TrendingUp, BadgeCheck, X, ShoppingBag, DollarSign, ArrowUpRight, BarChart3, Settings, ShieldCheck, Upload, Loader, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProduct';
import { orderService, type OrderResponse, type OrderItemResponse } from '../services/orderService';
import { cloudinaryService } from '../services/cloudinaryservice';

export function SellerDashboard() {
  const { currentUser } = useAuth();
  const { products, addProduct, deleteProduct, updateProduct } = useProducts();
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

  // Local file upload states for Add Form
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addPreview, setAddPreview] = useState<string>('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    stock: '',
  });

  // Local file upload states for Edit Form
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string>('');
  
  // Overall upload loading state
  const [isUploading, setIsUploading] = useState(false);

  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [sellerStats, setSellerStats] = useState<{ totalRevenue: number; totalItemsSold: number } | null>(null);

  useEffect(() => {
    const fetchSellerStats = async () => {
      const result = await orderService.getSellerStats();
      if (result.ok && result.data) {
        setSellerStats(result.data);
      } else {
        toast.error(result.error || "Failed to load seller stats");
      }
    };
    fetchSellerStats();
  }, []);

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

  const handleAddFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.");
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    setAddFile(file);
    const preview = URL.createObjectURL(file);
    setAddPreview(preview);
    setFormData(prev => ({ ...prev, image: preview }));
  };

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.");
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    setEditFile(file);
    const preview = URL.createObjectURL(file);
    setEditPreview(preview);
    setEditFormData(prev => ({ ...prev, image: preview }));
  };

  const resetAddForm = () => {
    setFormData({ 
      name: '', 
      description: '', 
      price: '', 
      category: '', 
      image: '', 
      stock: '' 
    });
    if (addPreview) {
      URL.revokeObjectURL(addPreview);
    }
    setAddFile(null);
    setAddPreview('');
    setShowAddForm(false);
  };

  const resetEditForm = () => {
    if (editPreview) {
      URL.revokeObjectURL(editPreview);
    }
    setEditFile(null);
    setEditPreview('');
    setEditingProduct(null);
    setShowEditModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    if (!addFile) {
      toast.error('Product image is required. Please upload a local image file.');
      return;
    }

    setIsUploading(true);
    let finalImageUrl = '';

    try {
      // 1. Upload to Cloudinary
      const result = await cloudinaryService.uploadImage(addFile, "bagify_products");
      if (!result.ok || !result.data) {
        toast.error(result.error || "Failed to upload product image to Cloudinary");
        setIsUploading(false);
        return;
      }
      
      finalImageUrl = result.data.secure_url;
      console.log("☁️ Product image uploaded:", finalImageUrl);

      await addProduct({
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category.trim(),
        image: finalImageUrl,
        stock: parseInt(formData.stock),
        sellerId: currentSellerId,
        sellerName: currentUser.name,
        sellerRating: 4.5, // Default seller rating
      } as any);

      resetAddForm();
    } catch (error) {
      console.error("Failed to add product:", error);
      toast.error("Failed to add product");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Validation
    if (!editFormData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!editFormData.description.trim()) {
      toast.error('Product description is required');
      return;
    }
    if (!editFormData.category.trim()) {
      toast.error('Product category is required');
      return;
    }
    const priceNum = parseFloat(editFormData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }
    const stockNum = parseInt(editFormData.stock);
    if (isNaN(stockNum) || stockNum < 0) {
      toast.error('Stock cannot be negative');
      return;
    }

    setIsUploading(true);
    let finalImageUrl = editFormData.image;

    try {
      // If a new local file is selected, upload it to Cloudinary first
      if (editFile) {
        const result = await cloudinaryService.uploadImage(editFile, "bagify_products");
        if (!result.ok || !result.data) {
          toast.error(result.error || "Failed to upload new product image to Cloudinary");
          setIsUploading(false);
          return;
        }
        finalImageUrl = result.data.secure_url;
        console.log("☁️ New product image uploaded:", finalImageUrl);
      }

      const success = await updateProduct(editingProduct.id, {
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
        price: priceNum,
        category: editFormData.category.trim(),
        image: finalImageUrl,
        stock: stockNum,
      });

      if (success) {
        resetEditForm();
      }
    } catch (error) {
      console.error("Failed to update product:", error);
      toast.error("Failed to update product");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      deleteProduct(productId);
      toast.success('Product deleted successfully');
    }
  };


  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Dynamically compute seller rating from real review data
  const allReviews = sellerProducts.flatMap(p => p.reviews || []);
  const sellerRating = allReviews.length > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    : 0;
  const totalReviews = allReviews.length;

  return (
    <div className="min-h-screen bg-slate-50/50 relative overflow-hidden font-sans pb-16 admin-panel">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-200/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-blue-200/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-purple-200/50">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                {currentUser.name}'s Store
                {currentUser.verification?.status === 'APPROVED' && (
                  <span title="Verified Seller" className="inline-flex items-center justify-center p-0.5 rounded-full bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-100">
                    <BadgeCheck className="w-6 h-6 fill-emerald-500 text-white" />
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-lg text-xs font-bold border border-amber-200/40">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {totalReviews === 0 ? "No reviews" : `${sellerRating.toFixed(1)} Rating`}
                </div>
                {totalReviews > 0 && (
                  <span className="text-sm text-slate-500 font-medium">({totalReviews} customers reviewed)</span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Stat 1: Total Products */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 font-bold text-xs tracking-wider uppercase mb-1.5">Total Products</p>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{sellerProducts.length}</p>
                
              </div>
              <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-300">
                <ShoppingBag className="w-7 h-7" />
              </div>
            </div>
          </div>

          {/* Stat 2: Items Sold */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 font-bold text-xs tracking-wider uppercase mb-1.5">Items Sold</p>
                {sellerStats === null ? (
                  <div className="h-9 w-16 bg-slate-100 rounded animate-pulse mt-1" />
                ) : (
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{sellerStats.totalItemsSold}</p>
                )}
               
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-7 h-7" />
              </div>
            </div>
          </div>

          {/* Stat 3: Total Revenue */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 font-bold text-xs tracking-wider uppercase mb-1.5">Total Revenue</p>
                {sellerStats === null ? (
                  <div className="h-9 w-24 bg-slate-100 rounded animate-pulse mt-1" />
                ) : (
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">Rs. {sellerStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                )}
               
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-7 h-7" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 shadow-sm mb-10">
          <h2 className="text-base font-bold text-slate-900 mb-5 tracking-tight flex items-center gap-2">
            <Settings className="w-4.5 h-4.5 text-purple-600 animate-spin-slow" />
            Quick Operations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="group relative flex items-center justify-between p-4 bg-gradient-to-tr from-purple-500 to-indigo-600 text-white rounded-2xl shadow-sm hover:shadow-lg hover:shadow-purple-200/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-sm">Add Product</span>
              </div>
              <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => navigate('/')}
              className="group relative flex items-center justify-between p-4 bg-white border border-slate-200 text-slate-700 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 hover:bg-blue-50/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                  <Package className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-800 text-sm">View Store</span>
              </div>
              <ArrowUpRight className="w-4 h-4 opacity-30 group-hover:opacity-100 text-blue-600 transition-opacity" />
            </button>

            <button
              onClick={() => navigate('/edit-profile')}
              className="group relative flex items-center justify-between p-4 bg-white border border-slate-200 text-slate-700 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 hover:bg-emerald-50/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
                  <Edit className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-800 text-sm">Edit Profile</span>
              </div>
              <ArrowUpRight className="w-4 h-4 opacity-30 group-hover:opacity-100 text-emerald-600 transition-opacity" />
            </button>

            <button
              className="group relative flex items-center justify-between p-4 bg-white border border-slate-200 text-slate-700 rounded-2xl shadow-sm hover:shadow-md hover:border-amber-300 hover:bg-amber-50/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-800 text-sm">View Analytics</span>
              </div>
              <ArrowUpRight className="w-4 h-4 opacity-30 group-hover:opacity-100 text-amber-600 transition-opacity" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-200/40 backdrop-blur-md p-1.5 rounded-2xl inline-flex gap-1.5 mb-8 shadow-inner border border-slate-250/20">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-300 ${
              activeTab === 'products'
                ? 'bg-white text-purple-700 shadow-sm border border-slate-100'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Package className="w-4.5 h-4.5" />
            Products Catalog
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-300 ${
              activeTab === 'orders'
                ? 'bg-white text-purple-700 shadow-sm border border-slate-100'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4.5 h-4.5" />
            Order Requests
          </button>
        </div>

        {/* Products Section */}
        {activeTab === 'products' && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 shadow-sm transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Products</h2>
                <p className="text-sm text-slate-500 mt-1">Manage and edit your store listings and stock levels.</p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="self-start sm:self-auto bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-md shadow-purple-200/50 flex items-center gap-2 hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </button>
            </div>

            {/* Add Product Form */}
            {showAddForm && (
              <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-6 mb-8 shadow-inner animate-fadeIn">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-purple-600" />
                    Add New Product
                  </h3>
                  <button onClick={resetAddForm} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200/50 rounded-xl focus:outline-none transition-all duration-200 text-sm font-medium"
                        placeholder="e.g. Leather Travel Duffle"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                        Category *
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200/50 rounded-xl focus:outline-none transition-all duration-200 text-sm font-medium"
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
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                        Price (Rs.) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-2.5 text-slate-400 font-bold text-sm">Rs.</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', e.target.value)}
                          className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200/50 rounded-xl focus:outline-none transition-all duration-200 text-sm font-medium"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.stock}
                        onChange={(e) => handleInputChange('stock', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200/50 rounded-xl focus:outline-none transition-all duration-200 text-sm font-medium"
                        placeholder="Enter quantity"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Product Image *
                    </label>
                    
                    {addPreview ? (
                      <div className="relative group rounded-2xl overflow-hidden border border-slate-250/80 h-64 bg-slate-50 flex items-center justify-center">
                        <img 
                          src={addPreview} 
                          alt="Product Preview" 
                          className="max-h-full max-w-full object-contain"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const fileInput = document.getElementById('add-product-image') as HTMLInputElement;
                              fileInput?.click();
                            }}
                            className="bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md"
                          >
                            Replace Image
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddFile(null);
                              setAddPreview('');
                              setFormData(prev => ({ ...prev, image: '' }));
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => {
                          const fileInput = document.getElementById('add-product-image') as HTMLInputElement;
                          fileInput?.click();
                        }}
                        className="border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-2xl p-8 text-center cursor-pointer transition-all bg-white hover:bg-purple-50/10 group flex flex-col items-center justify-center gap-2"
                      >
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">Click to upload product image</p>
                          <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, GIF or WebP (max. 5MB)</p>
                        </div>
                      </div>
                    )}
                    
                    <input 
                      id="add-product-image"
                      type="file" 
                      accept="image/jpeg,image/png,image/gif,image/webp" 
                      onChange={handleAddFileSelect} 
                      className="hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Description *
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200/50 rounded-xl focus:outline-none transition-all duration-200 resize-none text-sm font-medium"
                      placeholder="Describe your product materials, features, and dimensions..."
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold px-6 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-purple-200/50 flex items-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Saving Product...
                        </>
                      ) : (
                        "Add Product"
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={resetAddForm}
                      className="bg-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl hover:bg-slate-300 transition-all duration-200 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-xs font-extrabold tracking-wider">
                    <th className="text-left py-4 px-5">Product details</th>
                    <th className="text-left py-4 px-5">Category</th>
                    <th className="text-left py-4 px-5">Price</th>
                    <th className="text-left py-4 px-5">Stock status</th>
                    <th className="text-left py-4 px-5">Rating</th>
                    <th className="text-right py-4 px-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sellerProducts.map((product) => {
                    const isOutOfStock = product.stock <= 0;
                    const isLowStock = product.stock > 0 && product.stock <= 10;
                    return (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition-all duration-200 group">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-4">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm group-hover:scale-105 transition-transform duration-205"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=100';
                              }}
                            />
                            <div>
                              <p className="font-extrabold text-slate-900 text-sm mb-0.5">{product.name}</p>
                              <p className="text-xs text-slate-400 line-clamp-1 max-w-[240px]">
                                {product.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span className="inline-flex px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold tracking-wide">
                            {product.category}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="font-black text-slate-900 text-sm">Rs. {product.price.toFixed(2)}</span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200/30 rounded-full text-xs font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse" />
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/30 rounded-full text-xs font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                                Only {product.stock} Left
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/30 rounded-full text-xs font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                {product.stock} Available
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="text-slate-800 font-extrabold text-sm">
                              {product.averageRating > 0 ? product.averageRating.toFixed(1) : 'New'}
                            </span>
                            <span className="text-slate-400 text-xs">
                              ({product.reviews?.length || 0})
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => {
                                setEditingProduct(product);
                                setEditFormData({
                                  name: product.name,
                                  description: product.description,
                                  price: String(product.price),
                                  category: product.category,
                                  image: product.image,
                                  stock: String(product.stock),
                                });
                                setShowEditModal(true);
                              }}
                              className="p-2 hover:bg-blue-50 rounded-xl transition-all duration-150 text-blue-600 hover:text-blue-700"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              className="p-2 hover:bg-rose-50 rounded-xl transition-all duration-150 text-rose-500 hover:text-rose-750"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {sellerProducts.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-5 text-purple-600 shadow-inner">
                    <Package className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No Products Listed</h3>
                  <p className="text-slate-400 max-w-sm mx-auto text-sm mb-6">
                    You haven't listed any bags yet. Add your first product to start making sales!
                  </p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all duration-300 shadow-md shadow-purple-200/50 inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Your First Product
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Section */}
        {activeTab === 'orders' && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 shadow-sm transition-all duration-300">
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Order Request Manager</h2>
              <p className="text-sm text-slate-500 mt-1">
                Track and dispatch individual purchase orders. The customer receives automated shipping notifications.
              </p>
            </div>

            {isLoadingOrders ? (
              <div className="text-center py-16 text-slate-400 font-medium">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4" />
                Syncing orders database...
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 text-slate-400 shadow-inner">
                  <TrendingUp className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">No Orders Yet</h3>
                <p className="text-slate-400 max-w-sm mx-auto text-sm">
                  Your store order book is currently empty. When customers buy your bags, they will appear here!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => {
                  const myItems = getSellerItems(order);
                  if (myItems.length === 0) return null;
                  return (
                    <div key={order.id} className="border border-slate-100 bg-slate-50/20 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                      {/* Order header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-slate-50/80 border-b border-slate-100">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-extrabold text-slate-900 text-sm">Order #{order.id}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-350" />
                          <span className="text-xs text-slate-500 font-bold">{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-355" />
                          <span className="inline-flex px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-extrabold rounded-md uppercase tracking-wider">Buyer #{order.buyerId}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-500 font-bold">
                            Grand Total: <span className="font-extrabold text-slate-900 text-sm">Rs. {order.totalAmount.toFixed(2)}</span>
                          </span>
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase ${getStatusColor(order.status)}`}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* My items in this order */}
                      <div className="divide-y divide-slate-100 bg-white">
                        {myItems.map((item) => (
                          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/30 transition-colors duration-150">
                            <div className="flex items-center gap-4">
                              {item.imageUrl && (
                                <img
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=100';
                                  }}
                                />
                              )}
                              <div>
                                <p className="font-bold text-slate-950 text-sm">{item.productName}</p>
                                <p className="text-xs text-slate-400 font-bold mt-0.5">
                                  Quantity: <span className="text-slate-800 font-extrabold">{item.quantity}</span> × Rs. {item.priceAtPurchase.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 self-end sm:self-auto">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                                item.itemStatus === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border-emerald-250/30' :
                                item.itemStatus === 'SHIPPED' ? 'bg-blue-50 text-blue-700 border-blue-250/30' :
                                item.itemStatus === 'PACKED' ? 'bg-cyan-50 text-cyan-700 border-cyan-250/30' :
                                item.itemStatus === 'PROCESSING' ? 'bg-amber-50 text-amber-700 border-amber-250/30' :
                                item.itemStatus === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-250/30' :
                                'bg-yellow-50 text-yellow-700 border-yellow-250/30'
                              }`}>
                                {item.itemStatus}
                              </span>
                              
                              {/* Seller controls */}
                              {order.status !== 'CANCELLED' && item.itemStatus !== 'DELIVERED' && (
                                <select
                                  value={item.itemStatus}
                                  onChange={(e) => handleItemStatusChange(order.id, item.id, e.target.value)}
                                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white shadow-sm transition-all"
                                >
                                  <option value="PENDING">PENDING</option>
                                  <option value="PROCESSING">PROCESSING</option>
                                  <option value="PACKED">PACKED</option>
                                  <option value="SHIPPED">SHIPPED</option>
                                </select>
                              )}
                              {item.itemStatus === 'DELIVERED' && (
                                <span className="text-xs text-emerald-600 font-extrabold flex items-center gap-1">
                                  <ShieldCheck className="w-4 h-4 fill-emerald-500 text-white" />
                                  Delivered
                                </span>
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
      
      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={resetEditForm}
          />
          
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 z-10 my-8 animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-purple-600" />
                Edit Catalog Item
              </h3>
              <button
                onClick={resetEditForm}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200/50 rounded-xl focus:outline-none transition-all duration-200 text-sm font-medium"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={editFormData.category}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200/50 rounded-xl focus:outline-none transition-all duration-200 text-sm font-medium"
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
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Price (Rs.) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-slate-400 font-bold text-sm">Rs.</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={editFormData.price}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200/50 rounded-xl focus:outline-none transition-all duration-200 text-sm font-medium"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editFormData.stock}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, stock: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200/50 rounded-xl focus:outline-none transition-all duration-200 text-sm font-medium"
                    placeholder="Enter stock quantity"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Product Image *
                </label>
                
                {editPreview || editFormData.image ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-slate-250/80 h-64 bg-slate-50 flex items-center justify-center">
                    <img 
                      src={editPreview || editFormData.image} 
                      alt="Product Preview" 
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300';
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const fileInput = document.getElementById('edit-product-image') as HTMLInputElement;
                          fileInput?.click();
                        }}
                        className="bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => {
                      const fileInput = document.getElementById('edit-product-image') as HTMLInputElement;
                      fileInput?.click();
                    }}
                    className="border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-2xl p-8 text-center cursor-pointer transition-all bg-white hover:bg-purple-50/10 group flex flex-col items-center justify-center gap-2"
                  >
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">Click to upload product image</p>
                      <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, GIF or WebP (max. 5MB)</p>
                    </div>
                  </div>
                )}
                
                <input 
                  id="edit-product-image"
                  type="file" 
                  accept="image/jpeg,image/png,image/gif,image/webp" 
                  onChange={handleEditFileSelect} 
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200/50 rounded-xl focus:outline-none transition-all duration-200 resize-none text-sm font-medium"
                  placeholder="Describe your product..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={resetEditForm}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200/50 text-sm flex items-center gap-2 disabled:bg-purple-400"
                >
                  {isUploading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}