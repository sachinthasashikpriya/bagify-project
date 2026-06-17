// MainLayout.tsx
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useAuth } from "../hooks/useAuth"; // assuming you have this
import { LoginModal } from "../components/LoginModal";
// import { useCart } from "../hooks/useCart"; // if you have a cart hook

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, isLoginModalOpen, closeLoginModal } = useAuth(); // adjust names to your hook
  // const { items } = useCart(); // or however you get cart count

  const hideHeader =
    location.pathname === "/login" || location.pathname === "/signup";

  const currentPage =
    location.pathname === "/" ? "home" : location.pathname.slice(1);

  const handleNavigate = (path: string) => navigate(path);
  const handleLogout = async () => {
    await logout(); // handle errors/toasts if needed
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div className="flex-grow">
        {!hideHeader && (
          <Header
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            cartItems={[]} // replace with cart count if you have it
            currentPage={currentPage}
          />
        )}
        <Outlet />
      </div>
      {!hideHeader && <Footer />}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </div>
  );
}