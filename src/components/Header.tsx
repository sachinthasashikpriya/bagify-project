import { useState } from "react";
import { ShieldCheck, ShoppingCart, User, Menu, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";
import type { CartItem, User as UserType } from "../types";
import {cloudinaryService } from "../services/cloudinaryservice";

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

  currentPage,
}: HeaderProps) {
  const { cartItems } = useCart(); // Add this hook
  const { openLoginModal } = useAuth();
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0); // Calculate total count
  const location = useLocation();
  const isAdminDashboard = location.pathname === "/admin-dashboard";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ✅ Get optimized profile image URL
  const getProfileImageUrl = (): string | null => {
    if (!currentUser) return null;
    
    if (currentUser.profileImage) {
      return cloudinaryService.getOptimizedUrl(currentUser.profileImage, 40, 40);
    }
    
    return null;
  };

  const profileImageUrl = getProfileImageUrl();

  return (
    <header className={`bg-white shadow-sm sticky top-0 z-50 ${isAdminDashboard ? "lg:pl-64" : ""}`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
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
            {currentUser?.role === "SELLER" && (
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
            {currentUser?.role === "BUYER" && (
              <button
                onClick={() => onNavigate("BUYER-dashboard")}
                className={`${
                  currentPage === "BUYER-dashboard"
                    ? "text-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                My Orders
              </button>
            )}
            {currentUser?.role === "ADMIN" && (
              <button
                onClick={() => onNavigate("ADMIN-dashboard")}
                className={`${
                  currentPage === "ADMIN-dashboard"
                    ? "text-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                ADMIN Panel
              </button>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {currentUser?.role === "BUYER" && (
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

            {/* Desktop user section */}
            <div className="hidden md:flex items-center gap-3">
              {currentUser ? (
                <>
                  {currentUser.role === "SELLER" && (
                    <button
                      onClick={() => onNavigate("/edit-profile?section=verification")}
                      className="flex items-center justify-center w-9 h-9 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                      title="Verified Seller"
                      aria-label="Open verified seller section"
                    >
                      <ShieldCheck className="w-5 h-5" />
                    </button>
                  )}

                  {/* Profile Photo / Avatar */}
                  <button
                    onClick={() => onNavigate("/edit-profile")}
                    className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-purple-100 flex-shrink-0">
                      {profileImageUrl ? (
                        <img
                          src={profileImageUrl}
                          alt={currentUser.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full bg-purple-100 flex items-center justify-center">
                                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                  </svg>
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-600" />
                        </div>
                      )}
                    </div>
                  </button>

                  <span className="text-sm text-gray-700">
                    {currentUser.name}
                  </span>

                  <button
                    onClick={onLogout}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={openLoginModal}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Login
                </button>
              )}
            </div>

            {/* Mobile menu toggle button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-3 shadow-inner">
          <div className="space-y-1">
            <button
              onClick={() => {
                onNavigate("home");
                setIsMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                currentPage === "home"
                  ? "bg-purple-50 text-purple-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              Shop
            </button>
            {currentUser?.role === "SELLER" && (
              <button
                onClick={() => {
                  onNavigate("seller-dashboard");
                  setIsMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                  currentPage === "seller-dashboard"
                    ? "bg-purple-50 text-purple-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                My Store
              </button>
            )}
            {currentUser?.role === "BUYER" && (
              <button
                onClick={() => {
                  onNavigate("BUYER-dashboard");
                  setIsMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                  currentPage === "BUYER-dashboard"
                    ? "bg-purple-50 text-purple-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                My Orders
              </button>
            )}
            {currentUser?.role === "ADMIN" && (
              <button
                onClick={() => {
                  onNavigate("ADMIN-dashboard");
                  setIsMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                  currentPage === "ADMIN-dashboard"
                    ? "bg-purple-50 text-purple-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                ADMIN Panel
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100">
            {currentUser ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-1">
                  <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-purple-100 flex-shrink-0">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{currentUser.role.toLowerCase()}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onNavigate("/edit-profile");
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  Edit Profile
                </button>

                {currentUser.role === "SELLER" && (
                  <button
                    onClick={() => {
                      onNavigate("/edit-profile?section=verification");
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Verification Status
                  </button>
                )}

                <button
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  openLoginModal();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 text-sm font-semibold text-center"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
