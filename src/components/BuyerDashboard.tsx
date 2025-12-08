import { MapPin, ShoppingBag, User } from "lucide-react";
import { Order, User as UserType } from "../types";

interface BuyerDashboardProps {
  buyer: UserType;
  orders: Order[];
}

export function BuyerDashboard({ buyer, orders }: BuyerDashboardProps) {
  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const completedOrders = orders.filter((o) => o.status === "delivered").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <h1 className="text-3xl text-gray-900 mb-8">My Account</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Account Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl text-gray-900 mb-4">
                Profile Information
              </h2>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-900">{buyer.name}</p>
                  <p className="text-sm text-gray-500">{buyer.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-gray-900">
                    {buyer.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="text-gray-900">
                    {buyer.address || "Not provided"}
                  </p>
                </div>
              </div>

              <button className="w-full mt-6 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">
                Edit Profile
              </button>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg text-gray-900 mb-4">Shopping Stats</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="text-gray-900">{orders.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completed</span>
                  <span className="text-gray-900">{completedOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Spent</span>
                  <span className="text-gray-900">
                    ${totalSpent.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl text-gray-900 mb-6">Order History</h2>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No orders yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Start shopping to see your orders here
                  </p>
                </div>
              ) : (
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

                      {/* Products */}
                      <div className="space-y-3 mb-4">
                        {order.products.map((product, index) => (
                          <div key={index} className="flex items-center gap-4">
                            <img
                              src={product.image}
                              alt={product.productName}
                              className="w-16 h-16 rounded object-cover"
                            />
                            <div className="flex-1">
                              <p className="text-gray-900">
                                {product.productName}
                              </p>
                              <p className="text-sm text-gray-500">
                                Quantity: {product.quantity} × ${product.price}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Shipping Address */}
                      <div className="flex items-start gap-2 mb-4 pt-4 border-t border-gray-200">
                        <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                        <div>
                          <p className="text-sm text-gray-600">
                            Shipping Address
                          </p>
                          <p className="text-gray-900">
                            {order.shippingAddress}
                          </p>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <span className="text-gray-700">Total Amount</span>
                        <span className="text-xl text-gray-900">
                          ${order.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
