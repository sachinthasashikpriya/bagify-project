import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from '../components/HomePage';
import { LoginPage } from '../components/LoginPage';
import { SignupPage } from '../components/SignupPage';
import { ProductDetailPage } from '../components/ProductDetailPage';
import { SellerDashboard } from '../components/SellerDashboard';
import { BuyerDashboard } from '../components/BuyerDashboard';
import { AdminDashboard } from '../components/AdminDashboard';
import { CartPage } from '../components/CartPage';
import { EditProfile } from '../components/EditProfile';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '../layouts/MainLayout';

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
            <ProtectedRoute allowedTypes={['seller']}>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/buyer-dashboard"
          element={
            <ProtectedRoute allowedTypes={['buyer']}>
              <BuyerDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedTypes={['admin']}>
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