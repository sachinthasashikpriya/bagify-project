import {
  Search,
  ShoppingBag,
  Star,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Order, Product, Seller, User } from "../types";

interface AdminDashboardProps {
  sellers: Seller[];
  buyers: User[];
  products: Product[];
  orders: Order[];
}

export function AdminDashboard({
  sellers,
  buyers,
  products,
  orders,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "sellers" | "buyers" | "products" | "orders"
  >("sellers");
  const [searchTerm, setSearchTerm] = useState("");

  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );
  const averageRating =
    sellers.reduce((sum, seller) => sum + seller.rating, 0) / sellers.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <h1 className="text-3xl text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Sellers</p>
                <p className="text-3xl text-gray-900">{sellers.length}</p>
              </div>
              <Store className="w-12 h-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Buyers</p>
                <p className="text-3xl text-gray-900">{buyers.length}</p>
              </div>
              <Users className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Products</p>
                <p className="text-3xl text-gray-900">{products.length}</p>
              </div>
              <ShoppingBag className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl text-gray-900">
                  ${totalRevenue.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("sellers")}
              className={`px-4 py-2 border-b-2 ${
                activeTab === "sellers"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Sellers
            </button>
            <button
              onClick={() => setActiveTab("buyers")}
              className={`px-4 py-2 border-b-2 ${
                activeTab === "buyers"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Buyers
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`px-4 py-2 border-b-2 ${
                activeTab === "products"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 border-b-2 ${
                activeTab === "orders"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Orders
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Sellers Tab */}
          {activeTab === "sellers" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-700">
                      Seller
                    </th>
                    <th className="text-left py-3 px-4 text-gray-700">
                      Store Name
                    </th>
                    <th className="text-left py-3 px-4 text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 text-gray-700">
                      Rating
                    </th>
                    <th className="text-left py-3 px-4 text-gray-700">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sellers
                    .filter(
                      (s) =>
                        s.name
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        s.storeName
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                    )
                    .map((seller) => (
                      <tr
                        key={seller.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-gray-900">
                          {seller.name}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {seller.storeName}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {seller.email}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {seller.phone}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-gray-700">
                              {seller.rating.toFixed(1)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {seller.joinedDate}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Buyers Tab */}
          {activeTab === "buyers" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 text-gray-700">
                      Address
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {buyers
                    .filter(
                      (b) =>
                        b.name
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        b.email.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((buyer) => (
                      <tr
                        key={buyer.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-gray-900">
                          {buyer.name}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {buyer.email}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {buyer.phone || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {buyer.address || "N/A"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-700">
                      Product
                    </th>
                    <th className="text-left py-3 px-4 text-gray-700">
                      Seller
                    </th>
                    <th className="text-left py-3 px-4 text-gray-700">
                      Category
                    </th>
                    <th className="text-left py-3 px-4 text-gray-700">Price</th>
                    <th className="text-left py-3 px-4 text-gray-700">Stock</th>
                    <th className="text-left py-3 px-4 text-gray-700">
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .filter(
                      (p) =>
                        p.name
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        p.category
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                    )
                    .map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-12 h-12 rounded object-cover"
                            />
                            <span className="text-gray-900">
                              {product.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {product.sellerName}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {product.category}
                        </td>
                        <td className="py-3 px-4 text-gray-900">
                          ${product.price}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {product.stock}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-gray-700">
                              {product.averageRating > 0
                                ? product.averageRating.toFixed(1)
                                : "N/A"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-gray-900">
                        Order #{order.id.toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {order.orderDate}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "shipped"
                          ? "bg-blue-100 text-blue-700"
                          : order.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Amount</p>
                      <p className="text-gray-900">
                        ${order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Items</p>
                      <p className="text-gray-900">{order.products.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Shipping Address</p>
                      <p className="text-gray-900">{order.shippingAddress}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
