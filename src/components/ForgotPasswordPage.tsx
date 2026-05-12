import { Loader, Mail, ShoppingCart, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "../services/authservice";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(email.trim().toLowerCase());

      if (response.ok) {
        setIsSubmitted(true);
        toast.success("Password reset instructions sent to your email!");
      } else {
        // We still show success or a generic message to prevent email enumeration, 
        // but for better DX in dev we might show the error.
        // The story says: "silently succeed if not found to prevent email enumeration"
        // So we follow that logic on frontend too if the backend does it.
        setIsSubmitted(true);
        toast.success("If an account exists for that email, we've sent reset instructions.");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 overflow-hidden relative">
           {/* Decorative elements */}
           <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-12 -mt-12 blur-2xl opacity-50"></div>
           
           <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>

          {!isSubmitted ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Forgot Password?
              </h2>
              <p className="text-gray-500 mb-8 text-sm">
                No worries! Enter your email address and we'll send you instructions to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${error ? 'text-red-400' : 'text-gray-400 group-focus-within:text-purple-600'}`} />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="e.g. john@example.com"
                      disabled={isLoading}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-4 transition-all ${
                        error 
                          ? "border-red-500 focus:ring-red-500/10" 
                          : "border-gray-200 focus:ring-purple-600/10 focus:border-purple-600"
                      } disabled:opacity-50`}
                      required
                    />
                  </div>
                  {error && (
                    <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                      {error}
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
                    <Mail className="w-5 h-5" />
                  )}
                  {isLoading ? "Sending Instructions..." : "Send Reset Link"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
              <p className="text-gray-500 mb-8">
                We've sent a password reset link to <span className="font-bold text-gray-700">{email}</span>. Please check your inbox and follow the instructions.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="w-full text-purple-600 hover:text-purple-700 font-bold text-sm transition-colors"
                >
                  Didn't receive an email? Try again
                </button>
                <div className="h-px bg-gray-100 w-full"></div>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full bg-gray-50 text-gray-600 py-3 rounded-xl hover:bg-gray-100 transition-colors font-bold text-sm"
                >
                  Return to Login
                </button>
              </div>
            </div>
          )}
        </div>
        
        <p className="mt-8 text-center text-xs text-gray-400 font-medium tracking-wide uppercase">
          &copy; 2026 Bagify Marketplace • Secure Authentication
        </p>
      </div>
    </div>
  );
}
