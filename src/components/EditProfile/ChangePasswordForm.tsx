import { KeyRound, Lock, Loader, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import { userService } from "../../services/userservice";

export function ChangePasswordForm() {
  const { token, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.currentPassword) e.currentPassword = "Current password is required";
    if (!formData.newPassword) e.newPassword = "New password is required";
    else if (formData.newPassword.length < 8) e.newPassword = "Password must be at least 8 characters";
    
    if (formData.newPassword !== formData.confirmPassword) {
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
      const response = await userService.changePassword(
        token,
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );

      if (!response.ok) {
        toast.error(response.error || "Failed to change password");
        return;
      }

      toast.success("Password changed successfully! Please log in again.");
      
      // Delay logout slightly so user can see the success message
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error) {
      console.error("Change password error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Lock className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Security Settings</h2>
            <p className="text-xs text-gray-500 font-medium">Update your password to keep your account secure</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Current Password */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Current Password
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all ${
                errors.currentPassword ? "border-red-500 bg-red-50" : "border-gray-200"
              }`}
              placeholder="••••••••"
            />
          </div>
          {errors.currentPassword && (
            <p className="mt-1 text-xs font-medium text-red-500 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.currentPassword}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* New Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all ${
                  errors.newPassword ? "border-red-500 bg-red-50" : "border-gray-200"
                }`}
                placeholder="Minimum 8 characters"
              />
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-xs font-medium text-red-500 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all ${
                  errors.confirmPassword ? "border-red-500 bg-red-50" : "border-gray-200"
                }`}
                placeholder="Re-type new password"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs font-medium text-red-500 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Lock className="w-5 h-5" />
            )}
            {isLoading ? "Updating Password..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
