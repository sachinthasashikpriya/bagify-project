import { Shield, ShoppingCart, Store, User } from "lucide-react";
import { useState } from "react";
import type { User as UserType } from "../types";

interface LoginPageProps {
  onLogin: (user: UserType) => void;
  sellers: UserType[];
  buyers: UserType[];
  admin: UserType;
  onNavigateToSignup?: () => void;
}

export function LoginPage({ onLogin, sellers, buyers, admin, onNavigateToSignup }: LoginPageProps) {
  const [userType, setUserType] = useState<"seller" | "buyer" | "admin">(
    "buyer"
  );

  const handleQuickLogin = (user: UserType) => {
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl text-gray-900">BagMarket</span>
          </div>
          <p className="text-gray-600">
            Your trusted marketplace for quality bags
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl text-gray-900 mb-6 text-center">Login</h2>

          {/* User Type Selection */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => setUserType("buyer")}
              className={`p-4 rounded-xl border-2 transition-all ${
                userType === "buyer"
                  ? "border-purple-600 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <User
                className={`w-8 h-8 mx-auto mb-2 ${
                  userType === "buyer" ? "text-purple-600" : "text-gray-400"
                }`}
              />
              <p
                className={`text-sm ${
                  userType === "buyer" ? "text-purple-600" : "text-gray-600"
                }`}
              >
                Buyer
              </p>
            </button>

            <button
              onClick={() => setUserType("seller")}
              className={`p-4 rounded-xl border-2 transition-all ${
                userType === "seller"
                  ? "border-purple-600 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Store
                className={`w-8 h-8 mx-auto mb-2 ${
                  userType === "seller" ? "text-purple-600" : "text-gray-400"
                }`}
              />
              <p
                className={`text-sm ${
                  userType === "seller" ? "text-purple-600" : "text-gray-600"
                }`}
              >
                Seller
              </p>
            </button>

            <button
              onClick={() => setUserType("admin")}
              className={`p-4 rounded-xl border-2 transition-all ${
                userType === "admin"
                  ? "border-purple-600 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Shield
                className={`w-8 h-8 mx-auto mb-2 ${
                  userType === "admin" ? "text-purple-600" : "text-gray-400"
                }`}
              />
              <p
                className={`text-sm ${
                  userType === "admin" ? "text-purple-600" : "text-gray-600"
                }`}
              >
                Admin
              </p>
            </button>
          </div>

          {/* Quick Login Options */}
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Quick login as {userType === "admin" ? "admin" : `a ${userType}`}:
            </p>

            {userType === "admin" && (
              <button
                onClick={() => handleQuickLogin(admin)}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 mb-3"
              >
                Login as Admin
              </button>
            )}

            {userType === "seller" && (
              <div className="space-y-3">
                {sellers.map((seller) => (
                  <button
                    key={seller.id}
                    onClick={() => handleQuickLogin(seller)}
                    className="w-full bg-white border-2 border-gray-200 text-gray-900 py-3 px-4 rounded-lg hover:border-purple-600 hover:bg-purple-50 text-left"
                  >
                    <p>{seller.name}</p>
                    <p className="text-sm text-gray-500">{seller.email}</p>
                  </button>
                ))}
              </div>
            )}

            {userType === "buyer" && (
              <div className="space-y-3">
                {buyers.map((buyer) => (
                  <button
                    key={buyer.id}
                    onClick={() => handleQuickLogin(buyer)}
                    className="w-full bg-white border-2 border-gray-200 text-gray-900 py-3 px-4 rounded-lg hover:border-purple-600 hover:bg-purple-50 text-left"
                  >
                    <p>{buyer.name}</p>
                    <p className="text-sm text-gray-500">{buyer.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700"
              >
                Login
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don&apos;t have an account?{" "}
            <button
              onClick={onNavigateToSignup}
              className="text-purple-600 hover:text-purple-700"
            >
              Sign up
            </button>
          </p>
        </div>

        {/* Demo Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            This is a demo. Use the quick login buttons above to explore
            different user roles.
          </p>
        </div>
      </div>
    </div>
  );
}
