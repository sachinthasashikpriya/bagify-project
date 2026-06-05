import { Home, Shield } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedroles?: ("BUYER" | "SELLER" | "ADMIN")[];
}

export function ProtectedRoute({
  children,
  allowedroles,
}: ProtectedRouteProps) {
  const { currentUser, isLoading } = useAuth(); // ✅ Get isLoading
  const navigate = useNavigate();

  // ✅ CRITICAL: Wait for auth to load before redirecting
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check if user role is allowed
  if (allowedroles && !allowedroles.includes(currentUser.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-sm text-center max-w-md mx-4">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Your account role (
            {currentUser.role}) is not authorized for this resource.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Need access?</strong> Contact your administrator or switch
              to an account with the appropriate permissions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}