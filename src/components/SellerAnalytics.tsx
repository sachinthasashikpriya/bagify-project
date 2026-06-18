import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProduct';
import { orderService, type OrderResponse } from '../services/orderService';
import {
  ArrowLeft,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Star,
  Loader2,
  PieChart,
  ChevronRight,
  ChevronDown,
  TrendingDown,
  Info
} from 'lucide-react';

export function SellerAnalytics() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { products } = useProducts();
  const currentSellerId = String(currentUser?.id || '');

  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dashboard filter range: '7days' | '30days' | 'all'
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | 'all'>('7days');
  
  // Hover states for interactive SVG charts
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; date: string; value: number } | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  // Track which product's detailed reviews are expanded
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSellerOrders() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await orderService.getSellerOrders();
        if (result.ok && result.data) {
          setOrders(result.data);
        } else {
          setError(result.error || 'Failed to fetch orders.');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    }
    
    if (currentUser) {
      fetchSellerOrders();
    }
  }, [currentUser]);

  // 1. Filter orders matching the selected time range and only consider PAID and non-CANCELLED orders
  const timeFilteredOrders = useMemo(() => {
    // Only consider paid and non-cancelled orders for analytics
    const paidNonCancelledOrders = orders.filter(
      order => 
        (order.paymentStatus === 'PAID' || 
         ['PROCESSING', 'PARTIALLY_SHIPPED', 'SHIPPED', 'DELIVERED'].includes(order.status)) && 
        order.status !== 'CANCELLED'
    );

    if (timeRange === 'all') return paidNonCancelledOrders;

    const now = new Date();
    // Start of boundary days
    const limitDate = new Date();
    if (timeRange === '7days') {
      limitDate.setDate(now.getDate() - 7);
    } else if (timeRange === '30days') {
      limitDate.setDate(now.getDate() - 30);
    }
    
    // Set to start of that day
    limitDate.setHours(0, 0, 0, 0);

    return paidNonCancelledOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= limitDate;
    });
  }, [orders, timeRange]);

  // 2. Extract seller items from orders and perform aggregates
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalItemsSold = 0;
    let uniqueOrdersCount = 0;
    
    // Status counters
    const statusCounts = {
      PENDING: 0,
      PROCESSING: 0,
      PACKED: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0
    };

    // Category revenue and sales counters
    const categoryStats: Record<string, { revenue: number; units: number }> = {};
    
    // Product aggregates
    const productStats: Record<string, { id: string; name: string; image?: string; revenue: number; units: number }> = {};

    timeFilteredOrders.forEach(order => {
      const myItems = order.items.filter(item => String(item.sellerId) === currentSellerId);
      
      if (myItems.length > 0) {
        uniqueOrdersCount++;
        
        myItems.forEach(item => {
          const itemRev = item.priceAtPurchase * item.quantity;
          totalRevenue += itemRev;
          totalItemsSold += item.quantity;

          // Aggregates by status
          const status = (item.itemStatus || 'PENDING') as keyof typeof statusCounts;
          if (statusCounts[status] !== undefined) {
            statusCounts[status] += item.quantity;
          }

          // Fetch category from product context if possible
          const matchedProduct = products.find(p => String(p.id) === String(item.productId));
          const category = matchedProduct?.category || 'Uncategorized';

          if (!categoryStats[category]) {
            categoryStats[category] = { revenue: 0, units: 0 };
          }
          categoryStats[category].revenue += itemRev;
          categoryStats[category].units += item.quantity;

          // Aggregates by product
          const prodId = String(item.productId);
          if (!productStats[prodId]) {
            productStats[prodId] = {
              id: prodId,
              name: item.productName,
              image: item.imageUrl || matchedProduct?.image,
              revenue: 0,
              units: 0
            };
          }
          productStats[prodId].revenue += itemRev;
          productStats[prodId].units += item.quantity;
        });
      }
    });

    const averageOrderValue = uniqueOrdersCount > 0 ? totalRevenue / uniqueOrdersCount : 0;

    // Convert product stats to sorted array (Top Products)
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Convert category stats to array
    const categoriesList = Object.entries(categoryStats).map(([name, data]) => ({
      name,
      revenue: data.revenue,
      units: data.units,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      totalItemsSold,
      uniqueOrdersCount,
      averageOrderValue,
      statusCounts,
      topProducts,
      categoriesList
    };
  }, [timeFilteredOrders, currentSellerId, products]);

  // 3. Generate daily trend data for charts
  const salesTrendData = useMemo(() => {
    const dailyMap: Record<string, number> = {};
    const dateLabels: string[] = [];
    const now = new Date();

    if (timeRange === '7days' || timeRange === '30days') {
      const daysCount = timeRange === '7days' ? 7 : 30;
      // Initialize days
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateString = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        dailyMap[dateString] = 0;
        dateLabels.push(dateString);
      }
      
      timeFilteredOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const dateString = orderDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        
        if (dailyMap[dateString] !== undefined) {
          const myItems = order.items.filter(item => String(item.sellerId) === currentSellerId);
          const rev = myItems.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0);
          dailyMap[dateString] += rev;
        }
      });
    } else {
      // Group by Month-Year for 'all' time
      timeFilteredOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const dateString = orderDate.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
        
        const myItems = order.items.filter(item => String(item.sellerId) === currentSellerId);
        const rev = myItems.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0);
        
        if (!dailyMap[dateString]) {
          dailyMap[dateString] = 0;
          dateLabels.push(dateString);
        }
        dailyMap[dateString] += rev;
      });
    }

    return dateLabels.map(label => ({
      label,
      value: dailyMap[label] || 0
    }));
  }, [timeFilteredOrders, timeRange, currentSellerId]);

  // SVG Line/Area Chart dimensions & scales
  const chartConfig = useMemo(() => {
    const width = 600;
    const height = 250;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxVal = Math.max(...salesTrendData.map(d => d.value), 100);
    const yMax = Math.ceil(maxVal / 100) * 100; // Round up for neat grid lines

    const points = salesTrendData.map((d, index) => {
      const x = paddingLeft + (index / (salesTrendData.length - 1 || 1)) * chartWidth;
      const y = paddingTop + chartHeight - (d.value / yMax) * chartHeight;
      return { x, y, label: d.label, value: d.value };
    });

    // Generate path descriptions
    let linePath = '';
    let areaPath = '';

    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
      areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
    }

    return {
      width,
      height,
      paddingLeft,
      paddingTop,
      chartWidth,
      chartHeight,
      yMax,
      points,
      linePath,
      areaPath
    };
  }, [salesTrendData]);

  // Donut chart angles and calculations
  const donutConfig = useMemo(() => {
    const radius = 55;
    const strokeWidth = 14;
    const circumference = 2 * Math.PI * radius;
    const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#6B7280'];

    let accumulatedPercentage = 0;
    const segments = stats.categoriesList.map((cat, idx) => {
      const percent = cat.percentage / 100;
      const strokeLength = percent * circumference;
      const strokeOffset = -accumulatedPercentage * circumference;
      accumulatedPercentage += percent;

      return {
        name: cat.name,
        revenue: cat.revenue,
        percentage: cat.percentage,
        strokeLength,
        strokeOffset,
        color: colors[idx % colors.length]
      };
    });

    return {
      radius,
      strokeWidth,
      circumference,
      segments
    };
  }, [stats.categoriesList]);

  // Ratings calculation based on products reviews
  const reviewStats = useMemo(() => {
    let totalRatingsSum = 0;
    let reviewsCount = 0;
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    const sellerProducts = products.filter(p => String(p.sellerId) === currentSellerId);

    sellerProducts.forEach(product => {
      if (product.reviews && product.reviews.length > 0) {
        product.reviews.forEach(review => {
          reviewsCount++;
          totalRatingsSum += review.rating;
          const roundedRating = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
          ratingBreakdown[roundedRating]++;
        });
      }
    });

    const averageRating = reviewsCount > 0 ? totalRatingsSum / reviewsCount : 0;

    return {
      averageRating,
      reviewsCount,
      ratingBreakdown
    };
  }, [products, currentSellerId]);

  // Product-wise reviews and ratings calculation
  const productReviewStats = useMemo(() => {
    const sellerProducts = products.filter(p => String(p.sellerId) === currentSellerId);
    return sellerProducts.map(product => {
      let productRatingSum = 0;
      const reviews = product.reviews || [];
      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      
      reviews.forEach(review => {
        productRatingSum += review.rating;
        const roundedRating = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
        breakdown[roundedRating]++;
      });

      const avgRating = reviews.length > 0 ? productRatingSum / reviews.length : 0;

      return {
        id: product.id,
        name: product.name,
        image: product.image,
        avgRating,
        reviewsCount: reviews.length,
        ratingBreakdown: breakdown,
        reviews
      };
    });
  }, [products, currentSellerId]);

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Verifying Identity...</h3>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/seller-dashboard')}
              className="p-2.5 bg-white border border-slate-200 hover:border-purple-300 hover:text-purple-600 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 group"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-purple-600">Performance</span>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">Store Analytics</h1>
            </div>
          </div>

          {/* Time range switcher */}
          <div className="bg-slate-200/50 p-1 rounded-2xl border border-slate-200 inline-flex self-start sm:self-auto gap-1">
            {[
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: 'all', label: 'All Time' }
            ].map(range => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id as any)}
                className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                  timeRange === range.id
                    ? 'bg-white text-purple-700 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 mb-8 flex items-start gap-3">
            <Info className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-sm mb-0.5">Failed to fetch data</p>
              <p className="text-xs text-rose-600/90 font-medium">{error}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm animate-pulse">
                <div className="flex justify-between items-center mb-3">
                  <div className="h-3.5 bg-slate-100 rounded-md w-1/2" />
                  <div className="w-8 h-8 bg-slate-100 rounded-xl" />
                </div>
                <div className="h-6 bg-slate-100 rounded-md w-3/4 mb-2" />
                <div className="h-3 bg-slate-55 rounded-md w-2/5" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* KPI Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              
              {/* Revenue Card */}
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
                  <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold shadow-inner">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-xl font-extrabold text-slate-900 block">
                  Rs. {stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Items Sold Card */}
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Units Sold</span>
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold shadow-inner">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-xl font-extrabold text-slate-900 block">
                  {stats.totalItemsSold} bags
                </span>
              </div>

              {/* Unique Orders Card */}
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order Volume</span>
                  <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold shadow-inner">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-xl font-extrabold text-slate-900 block">
                  {stats.uniqueOrdersCount} requests
                </span>
                
              </div>

              {/* AOV Card */}
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg. Order Value</span>
                  <div className="w-8 h-8 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center font-bold shadow-inner">
                    <PieChart className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-xl font-extrabold text-slate-900 block">
                  Rs. {stats.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
               
              </div>

            </div>

            {/* Empty State when no orders exist */}
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm mb-8">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 text-slate-450 border border-slate-100 shadow-inner">
                  <TrendingDown className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-2">No Sales Analytics Available</h3>
                <p className="text-slate-400 max-w-sm mx-auto text-sm">
                  You haven't received any orders yet. Once buyers purchase your custom bags, detailed sales reports and graphs will load here!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                
                {/* Sales & Revenue Trend Chart */}
                <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Revenue Trend</h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">Visual representation of daily store earnings</p>
                  </div>
                  
                  {/* Interactive SVG Chart Container */}
                  <div className="relative mt-6 flex justify-center w-full">
                    {salesTrendData.every(d => d.value === 0) ? (
                      <div className="h-[250px] w-full flex flex-col items-center justify-center text-center">
                        <Info className="w-8 h-8 text-slate-300 mb-2" />
                        <span className="text-xs text-slate-400 font-bold">No revenue recorded in this period</span>
                      </div>
                    ) : (
                      <>
                        <svg
                          viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
                          className="w-full h-auto max-h-[300px]"
                        >
                          {/* Linear Gradient for Area Fill */}
                          <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Grid Lines */}
                          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                            const y = chartConfig.paddingTop + ratio * chartConfig.chartHeight;
                            const gridVal = Math.round(chartConfig.yMax * (1 - ratio));
                            return (
                              <g key={index}>
                                <line
                                  x1={chartConfig.paddingLeft}
                                  y1={y}
                                  x2={chartConfig.width - 20}
                                  y2={y}
                                  stroke="#F1F5F9"
                                  strokeWidth="1.5"
                                  strokeDasharray="4,4"
                                />
                                <text
                                  x={chartConfig.paddingLeft - 10}
                                  y={y + 4}
                                  textAnchor="end"
                                  fill="#94A3B8"
                                  className="text-[10px] font-extrabold font-mono"
                                >
                                  {gridVal > 1000 ? `${(gridVal / 1000).toFixed(1)}k` : gridVal}
                                </text>
                              </g>
                            );
                          })}

                          {/* Area Path */}
                          {chartConfig.areaPath && (
                            <path
                              d={chartConfig.areaPath}
                              fill="url(#areaGradient)"
                            />
                          )}

                          {/* Line Path */}
                          {chartConfig.linePath && (
                            <path
                              d={chartConfig.linePath}
                              fill="none"
                              stroke="#8B5CF6"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}

                          {/* Interaction Data Points */}
                          {chartConfig.points.map((point, index) => (
                            <g key={index}>
                              <circle
                                cx={point.x}
                                cy={point.y}
                                r="4"
                                fill="#FFFFFF"
                                stroke="#8B5CF6"
                                strokeWidth="2.5"
                                className="cursor-pointer hover:r-6 transition-all duration-150"
                                onMouseEnter={() => {
                                  setHoveredPoint({
                                    x: point.x,
                                    y: point.y,
                                    date: point.label,
                                    value: point.value
                                  });
                                }}
                                onMouseLeave={() => setHoveredPoint(null)}
                              />
                              {/* Invisible larger hover circle to make hovering easier */}
                              <circle
                                cx={point.x}
                                cy={point.y}
                                r="16"
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => {
                                  setHoveredPoint({
                                    x: point.x,
                                    y: point.y,
                                    date: point.label,
                                    value: point.value
                                  });
                                }}
                                onMouseLeave={() => setHoveredPoint(null)}
                              />
                            </g>
                          ))}

                          {/* X-axis Labels */}
                          {salesTrendData.map((d, idx) => {
                            // Display logic: avoid overlap for 30 days
                            const step = timeRange === '30days' ? 5 : 1;
                            if (idx % step !== 0 && idx !== salesTrendData.length - 1) return null;
                            
                            const x = chartConfig.paddingLeft + (idx / (salesTrendData.length - 1 || 1)) * chartConfig.chartWidth;
                            return (
                              <text
                                key={idx}
                                x={x}
                                y={chartConfig.height - 15}
                                textAnchor="middle"
                                fill="#94A3B8"
                                className="text-[10px] font-bold"
                              >
                                {d.label}
                              </text>
                            );
                          })}
                        </svg>

                        {/* Floating Tooltip Card */}
                        {hoveredPoint && (
                          <div
                            className="absolute bg-slate-900 text-white rounded-xl p-2.5 shadow-xl border border-slate-800 text-[11px] font-bold pointer-events-none z-10 animate-fadeIn"
                            style={{
                              left: `${(hoveredPoint.x / chartConfig.width) * 100}%`,
                              top: `${(hoveredPoint.y / chartConfig.height) * 100 - 30}%`,
                              transform: 'translate(-50%, -100%)'
                            }}
                          >
                            <span className="block text-slate-400 text-[9px] uppercase tracking-wider mb-0.5">{hoveredPoint.date}</span>
                            <span className="block text-purple-400">Rs. {hoveredPoint.value.toFixed(2)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Sales Share by Category */}
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Category Share</h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">Top performing product categories</p>
                  </div>

                  {stats.categoriesList.length === 0 ? (
                    <div className="h-[200px] flex flex-col items-center justify-center text-center">
                      <Info className="w-8 h-8 text-slate-300 mb-2" />
                      <span className="text-xs text-slate-400 font-bold">No product breakdown</span>
                    </div>
                  ) : (
                    <>
                      {/* SVG Donut */}
                      <div className="relative flex justify-center py-6">
                        <svg width="150" height="150" viewBox="0 0 150 150">
                          <g transform="rotate(-90 75 75)">
                            <circle
                              cx="75"
                              cy="75"
                              r={donutConfig.radius}
                              fill="none"
                              stroke="#F8FAFC"
                              strokeWidth={donutConfig.strokeWidth}
                            />
                            {donutConfig.segments.map((seg, idx) => (
                              <circle
                                key={idx}
                                cx="75"
                                cy="75"
                                r={donutConfig.radius}
                                fill="none"
                                stroke={seg.color}
                                strokeWidth={hoveredCategory === seg.name ? donutConfig.strokeWidth + 3 : donutConfig.strokeWidth}
                                strokeDasharray={`${seg.strokeLength} ${donutConfig.circumference - seg.strokeLength}`}
                                strokeDashoffset={seg.strokeOffset}
                                strokeLinecap="round"
                                className="transition-all duration-200 cursor-pointer"
                                onMouseEnter={() => setHoveredCategory(seg.name)}
                                onMouseLeave={() => setHoveredCategory(null)}
                              />
                            ))}
                          </g>
                        </svg>

                        {/* Central value overlay */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top Cat</span>
                          <span className="block text-sm font-black text-slate-800 truncate max-w-[80px]">
                            {stats.categoriesList[0]?.name || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
                        {donutConfig.segments.map((seg, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-2 rounded-xl transition-all duration-200 border ${
                              hoveredCategory === seg.name 
                                ? 'bg-slate-50 border-slate-200/60 shadow-sm' 
                                : 'border-transparent'
                            }`}
                            onMouseEnter={() => setHoveredCategory(seg.name)}
                            onMouseLeave={() => setHoveredCategory(null)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                              <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{seg.name}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-slate-900 block">Rs. {seg.revenue.toFixed(0)}</span>
                              <span className="text-[10px] font-bold text-slate-400 block">{seg.percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

              </div>
            )}

            {/* Products & Review Detail lists */}
            {orders.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Top Bags list */}
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-base font-black text-slate-900 mb-1">Top Selling Custom Bags</h3>
                  <p className="text-xs text-slate-400 font-bold mb-6">Your highest revenue generating bag designs</p>
                  
                  {stats.topProducts.length === 0 ? (
                    <div className="text-center py-10">
                      <span className="text-xs text-slate-400 font-bold">No product performance data</span>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {stats.topProducts.map((prod, index) => {
                        const maxRevenue = stats.topProducts[0].revenue || 1;
                        const barWidthPercent = (prod.revenue / maxRevenue) * 100;
                        return (
                          <div key={prod.id} className="flex items-center gap-4">
                            {/* Product Rank */}
                            <span className="text-sm font-black text-slate-300 w-5 text-center shrink-0">
                              #{index + 1}
                            </span>
                            
                            {/* Product Thumbnail */}
                            {prod.image ? (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=100';
                                }}
                              />
                            ) : (
                              <div className="w-11 h-11 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center shrink-0 text-slate-400">
                                <ShoppingBag className="w-5 h-5" />
                              </div>
                            )}
                            
                            {/* Details & Custom Progress Bar */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <h4 className="text-xs font-black text-slate-800 truncate">{prod.name}</h4>
                                <span className="text-xs font-black text-slate-900 shrink-0">Rs. {prod.revenue.toFixed(2)}</span>
                              </div>
                              
                              {/* Custom Track bar */}
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-purple-600 h-full rounded-full transition-all duration-500 ease-out"
                                  style={{ width: `${barWidthPercent}%` }}
                                />
                              </div>
                              
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mt-1">
                                <span>{prod.units} units sold</span>
                                <span>{((prod.revenue / stats.totalRevenue) * 100).toFixed(0)}% contribution</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Rating Performance & Quality */}
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-base font-black text-slate-900 mb-1">Quality & Reviews</h3>
                    <p className="text-xs text-slate-400 font-bold">Customer feedback metrics across your listing inventory</p>
                  </div>

                  {reviewStats.reviewsCount === 0 ? (
                    <div className="text-center py-10 flex-1 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-3 text-slate-400">
                        <Star className="w-6 h-6" />
                      </div>
                      <span className="text-xs text-slate-450 font-bold">No customer review ratings registered yet</span>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      {/* Overall Seller Rating Section */}
                      <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 mb-3 block">Overall Seller Rating</span>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          {/* Left: Star Rating Total */}
                          <div className="text-center sm:border-r border-slate-200/60 sm:pr-6 py-1 shrink-0">
                            <span className="text-4xl font-black text-slate-900 block leading-none">
                              {reviewStats.averageRating.toFixed(1)}
                            </span>
                            
                            {/* Rating Stars */}
                            <div className="flex items-center justify-center gap-0.5 mt-2 text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < Math.round(reviewStats.averageRating)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-200'
                                  }`}
                                />
                              ))}
                            </div>
                            
                            <span className="text-[10px] font-bold text-slate-400 block mt-1">
                              Based on {reviewStats.reviewsCount} reviews
                            </span>
                          </div>

                          {/* Right: Star Bar Breakdown */}
                          <div className="flex-1 w-full space-y-2">
                            {[5, 4, 3, 2, 1].map(stars => {
                              const count = reviewStats.ratingBreakdown[stars as 1|2|3|4|5] || 0;
                              const percent = (count / reviewStats.reviewsCount) * 100;
                              return (
                                <div key={stars} className="flex items-center gap-2.5">
                                  <span className="text-[9px] font-black text-slate-500 w-3 text-right">
                                    {stars}
                                  </span>
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                                  
                                  {/* Progress Track */}
                                  <div className="flex-1 bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-amber-400 h-full rounded-full"
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                  
                                  <span className="text-[9px] font-bold text-slate-400 w-6 text-right shrink-0">
                                    {count}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Product-wise Ratings & Reviews List */}
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 block">Product-wise Ratings & Reviews</span>
                        
                        <div className="space-y-3">
                          {productReviewStats.map(prodStats => {
                            const isExpanded = expandedProductId === prodStats.id;
                            return (
                              <div 
                                key={prodStats.id} 
                                className="border border-slate-200/80 rounded-2xl overflow-hidden transition-all duration-200 bg-white"
                              >
                                {/* Accordion Header */}
                                <button
                                  type="button"
                                  onClick={() => setExpandedProductId(isExpanded ? null : prodStats.id)}
                                  className="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-50/50 transition-colors"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    {prodStats.image ? (
                                      <img
                                        src={prodStats.image}
                                        alt={prodStats.name}
                                        className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center shrink-0 text-slate-400">
                                        <ShoppingBag className="w-4.5 h-4.5" />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <h4 className="text-xs font-bold text-slate-800 truncate pr-2">{prodStats.name}</h4>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <div className="flex items-center text-amber-450">
                                          <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5 shrink-0" />
                                          <span className="text-[10px] font-black text-slate-700">
                                            {prodStats.reviewsCount > 0 ? prodStats.avgRating.toFixed(1) : '0.0'}
                                          </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400">•</span>
                                        <span className="text-[10px] font-bold text-slate-400">
                                          {prodStats.reviewsCount} {prodStats.reviewsCount === 1 ? 'review' : 'reviews'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                                    )}
                                  </div>
                                </button>

                                {/* Accordion Content */}
                                {isExpanded && (
                                  <div className="border-t border-slate-100 bg-slate-50/30 p-4 space-y-4 animate-fadeIn">
                                    {prodStats.reviewsCount === 0 ? (
                                      <div className="text-center py-4 text-slate-400 text-[11px] font-bold">
                                        No reviews yet for this product.
                                      </div>
                                    ) : (
                                      <>
                                        {/* Product Rating Breakdown */}
                                        <div className="bg-white border border-slate-100 rounded-xl p-3 max-w-md">
                                          <span className="text-[9px] font-black uppercase text-slate-400 block mb-2">Rating Breakdown</span>
                                          <div className="space-y-1.5">
                                            {[5, 4, 3, 2, 1].map(stars => {
                                              const count = prodStats.ratingBreakdown[stars as 1|2|3|4|5] || 0;
                                              const percent = (count / prodStats.reviewsCount) * 100;
                                              return (
                                                <div key={stars} className="flex items-center gap-2">
                                                  <span className="text-[9px] font-bold text-slate-500 w-3 text-right">
                                                    {stars}
                                                  </span>
                                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                                                  <div className="flex-1 bg-slate-100 h-1 rounded-full overflow-hidden">
                                                    <div
                                                      className="bg-amber-400 h-full rounded-full"
                                                      style={{ width: `${percent}%` }}
                                                    />
                                                  </div>
                                                  <span className="text-[9px] font-bold text-slate-400 w-4 text-right shrink-0">
                                                    {count}
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        {/* Product Reviews List */}
                                        <div className="space-y-3">
                                          <span className="text-[9px] font-black uppercase text-slate-400 block">Customer Feedback</span>
                                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                            {prodStats.reviews.map(review => (
                                              <div key={review.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                                                <div className="flex items-center justify-between mb-1.5">
                                                  <span className="text-xs font-bold text-slate-700">{review.buyerName}</span>
                                                  <span className="text-[9px] font-bold text-slate-400">{review.date}</span>
                                                </div>
                                                <div className="flex items-center gap-0.5 text-amber-400 mb-2">
                                                  {[...Array(5)].map((_, i) => (
                                                    <Star
                                                      key={i}
                                                      className={`w-3 h-3 ${
                                                        i < review.rating
                                                          ? 'fill-amber-400 text-amber-400'
                                                          : 'text-slate-200'
                                                      }`}
                                                    />
                                                  ))}
                                                </div>
                                                <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/50 p-2 rounded-lg border border-slate-100/60">
                                                  {review.comment}
                                                </p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Fulfillment Status Funnel */}
            {orders.length > 0 && (
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm mt-8">
                <h3 className="text-base font-black text-slate-900 mb-1">Item Fulfillment Funnel</h3>
                <p className="text-xs text-slate-400 font-bold mb-6">Volume of order items currently traversing your workflow stages</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { label: 'Pending', count: stats.statusCounts.PENDING, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                    { label: 'Processing', count: stats.statusCounts.PROCESSING, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                    { label: 'Packed', count: stats.statusCounts.PACKED, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
                    { label: 'Shipped', count: stats.statusCounts.SHIPPED, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                    { label: 'Delivered', count: stats.statusCounts.DELIVERED, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                  ].map((stage, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-2xl p-4 flex flex-col items-center justify-center text-center ${stage.color}`}
                    >
                      <span className="text-2xl font-black">{stage.count}</span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider mt-1">{stage.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </>
        )}

      </div>
    </div>
  );
}
