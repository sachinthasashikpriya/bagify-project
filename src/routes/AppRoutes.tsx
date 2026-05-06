import { Navigate, Route, Routes } from "react-router-dom";
import { AdminDashboard } from "../components/AdminDashboard";
import { BuyerDashboard } from "../components/BuyerDashboard";
import { CartPage } from "../components/CartPage";
import { EditProfile } from "../components/EditProfile/EditProfile";
import { HomePage } from "../components/HomePage";
import { LoginPage } from "../components/LoginPage";
import { ProductDetailPage } from "../components/ProductDetailPage";
import { SellerDashboard } from "../components/SellerDashboard";
import { SignupPage } from "../components/SignupPage";
import { MainLayout } from "../layouts/MainLayout";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/product/:productId" element={<ProductDetailPage />} />

        <Route
          path="/seller-dashboard"
          element={
            <ProtectedRoute allowedroles={["SELLER"]}>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buyer-dashboard"
          element={
            <ProtectedRoute allowedroles={["BUYER"]}>
              <BuyerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedroles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
