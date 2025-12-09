import { ShoppingCart, User } from "lucide-react";
import type { CartItem, User as UserType } from "../types";

interface HeaderProps {
  currentUser: UserType | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  cartItems: CartItem[];
  currentPage: string;
}

export function Header({
  currentUser,
  onNavigate,
  onLogout,
  cartItems,
  currentPage,
}: HeaderProps) {
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate("home")}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-gray-900">BagMarket</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onNavigate("home")}
              className={`${
                currentPage === "home"
                  ? "text-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Shop
            </button>
            {currentUser?.type === "seller" && (
              <button
                onClick={() => onNavigate("seller-dashboard")}
                className={`${
                  currentPage === "seller-dashboard"
                    ? "text-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                My Store
              </button>
            )}
            {currentUser?.type === "buyer" && (
              <button
                onClick={() => onNavigate("buyer-dashboard")}
                className={`${
                  currentPage === "buyer-dashboard"
                    ? "text-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                My Orders
              </button>
            )}
            {currentUser?.type === "admin" && (
              <button
                onClick={() => onNavigate("admin-dashboard")}
                className={`${
                  currentPage === "admin-dashboard"
                    ? "text-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Admin Panel
              </button>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {currentUser?.type === "buyer" && (
              <button
                onClick={() => onNavigate("cart")}
                className="relative p-2 hover:bg-gray-100 rounded-lg"
              >
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="hidden sm:block text-sm text-gray-700">
                    {currentUser.name}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate("login")}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
