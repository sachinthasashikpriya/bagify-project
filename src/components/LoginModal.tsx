import { AlertTriangle, Loader, Lock, Mail, ShoppingCart, User, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authservice";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({ email: "", password: "" });
      setErrors({});
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Trap focus inside modal (optional but good for UX)
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const emailInput = modalRef.current.querySelector("#modal-email") as HTMLInputElement;
      emailInput?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[name];
      delete updated.form;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);
    console.log("📝 Starting modal login process...");

    try {
      const loginResponse = await authService.login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      console.log("📡 Modal login response:", loginResponse);

      if (!loginResponse.ok || !loginResponse.data) {
        if (loginResponse.error?.toLowerCase().includes("disabled")) {
          setErrors((prev) => ({
            ...prev,
            form: "Your account has been disabled by an administrator. Please contact support."
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            form: loginResponse.error || "Login failed. Please try again."
          }));
        }
        return;
      }

      const { user, token, refreshToken } = loginResponse.data;

      console.log("✅ Modal login successful! User:", user.email);

      // Save credentials to context and localStorage
      login(user, token, refreshToken);

      toast.success(`Welcome back, ${user.name}!`);
      onClose();

      // Navigate based on role
      switch (user.role) {
        case "ADMIN":
          navigate("/admin-dashboard", { replace: true });
          break;
        case "SELLER":
          navigate("/seller-dashboard", { replace: true });
          break;
        case "BUYER":
        default:
          // Remain on the current page for buyers
          break;
      }
    } catch (error) {
      console.error("💥 Modal login error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupRedirect = () => {
    onClose();
    navigate("/signup");
  };

  const handleForgotPasswordRedirect = () => {
    onClose();
    navigate("/forgot-password");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 z-10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition-all"
          aria-label="Close login modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal content */}
        <div className="p-8">
          {/* Logo and Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">BagMarket</span>
            </div>
            <p className="text-sm text-gray-500">
              Please login to access your account details
            </p>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-5 text-center">
            Login
          </h2>

          {errors.form && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errors.form}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="modal-email"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  id="modal-email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@example.com"
                  disabled={isLoading}
                  className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 border text-sm rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all disabled:opacity-50 ${
                    errors.email ? "border-red-500" : "border-slate-200"
                  }`}
                  required
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="modal-password"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPasswordRedirect}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  id="modal-password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 border text-sm rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all disabled:opacity-50 ${
                    errors.password ? "border-red-500" : "border-slate-200"
                  }`}
                  required
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-2.5 rounded-xl hover:bg-purple-700 transition-all font-semibold text-sm shadow-md shadow-purple-200/50 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <User className="w-4 h-4" />
              )}
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            Don't have an account?{" "}
            <button
              onClick={handleSignupRedirect}
              disabled={isLoading}
              className="text-purple-600 hover:text-purple-700 font-bold transition-colors disabled:opacity-50"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
