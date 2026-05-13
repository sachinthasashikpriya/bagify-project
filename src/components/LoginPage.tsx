import { Loader, Lock, Mail, ShoppingCart, User } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useEffect } from "react";

import { useAuth } from "../hooks/useAuth"; 
import { authService } from "../services/authservice";

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth(); 

  useEffect(() => {
    if (searchParams.get("expired") === "true") {
      // Small delay to ensure toast is ready
      const timer = setTimeout(() => {
        toast.error("Session expired. Please login again.", {
          description: "For your security, we've logged you out due to inactivity."
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);
    console.log("📝 Starting login process...");

    try {
      const loginResponse = await authService.login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      console.log("📡 Login response:", loginResponse);

      if (!loginResponse.ok || !loginResponse.data) {
        toast.error(loginResponse.error || "Login failed. Please try again.");
        return;
      }

      const { user, token, refreshToken } = loginResponse.data; // ✅ Get tokens from response

      console.log("✅ Login successful! User:", user.email);
      console.log("🔑 Tokens received:", token ? "Yes" : "No", refreshToken ? "Yes" : "No");
      console.log("📡 User role:", user.role);

      // ✅ CRITICAL FIX: Use login function with user, token, and refreshToken
      login(user, token, refreshToken);
      console.log("🔐 User and token saved to context and localStorage");

      toast.success(`Welcome back, ${user.name}!`);

      // ✅ Navigate based on role
      console.log("🚀 Navigating for role:", user.role);

      switch (user.role) {
        case "ADMIN":
          navigate("/admin-dashboard", { replace: true });
          break;
        case "SELLER":
          navigate("/seller-dashboard", { replace: true });
          break;
        case "BUYER":
          navigate("/", { replace: true });
          break;
        default:
          navigate("/", { replace: true });
          break;
      }
    } catch (error) {
      console.error("💥 Login error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToSignup = () => {
    navigate("/signup");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">BagMarket</span>
          </div>
          <p className="text-gray-600">
            Your trusted marketplace for quality bags
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Login
          </h2>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    disabled={isLoading}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    required
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <User className="w-5 h-5" />
                )}
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don&apos;t have an account?{" "}
            <button
              onClick={handleNavigateToSignup}
              disabled={isLoading}
              className="text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}