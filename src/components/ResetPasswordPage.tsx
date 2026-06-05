import { Loader, Lock, ShoppingCart, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "../services/authservice";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token");
      navigate("/login");
    }
  }, [token, navigate]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.password) {
      e.password = "New password is required";
    } else if (formData.password.length < 8) {
      e.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      e.confirmPassword = "Passwords do not match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!token) return;

    setIsLoading(true);

    try {
      const response = await authService.resetPassword({
        token,
        newPassword: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (response.ok) {
        setIsSuccess(true);
        toast.success("Password reset successful! You can now login with your new password.");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        toast.error(response.error || "Failed to reset password. The link may have expired.");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) return null;

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
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 overflow-hidden relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-12 -mt-12 blur-2xl opacity-50"></div>

          {!isSuccess ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Reset Password
              </h2>
              <p className="text-gray-500 mb-8 text-sm">
                Secure your account by choosing a strong new password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    New Password
                  </label>
                  <div className="relative group">
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${errors.password ? 'text-red-400' : 'text-gray-400 group-focus-within:text-purple-600'}`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 8 characters"
                      disabled={isLoading}
                      className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-4 transition-all ${
                        errors.password 
                          ? "border-red-500 focus:ring-red-500/10" 
                          : "border-gray-200 focus:ring-purple-600/10 focus:border-purple-600"
                      } disabled:opacity-50`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative group">
                    <CheckCircle2 className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${errors.confirmPassword ? 'text-red-400' : 'text-gray-400 group-focus-within:text-purple-600'}`} />
                    <input
                      type="password"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Re-type new password"
                      disabled={isLoading}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-4 transition-all ${
                        errors.confirmPassword 
                          ? "border-red-500 focus:ring-red-500/10" 
                          : "border-gray-200 focus:ring-purple-600/10 focus:border-purple-600"
                      } disabled:opacity-50`}
                      required
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-purple-600 text-white py-3.5 rounded-xl hover:bg-purple-700 transition-all font-bold shadow-lg shadow-purple-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                  {isLoading ? "Updating Password..." : "Reset Password"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
              <p className="text-gray-500 mb-8">
                Your password has been reset successfully. Redirecting you to login...
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-purple-600 text-white py-3.5 rounded-xl hover:bg-purple-700 transition-all font-bold shadow-lg shadow-purple-200"
              >
                Go to Login Now
              </button>
            </div>
          )}
        </div>
        
        <p className="mt-8 text-center text-xs text-gray-400 font-medium tracking-wide uppercase">
          &copy; 2026 Bagify Marketplace • Secure Reset
        </p>
      </div>
    </div>
  );
}
