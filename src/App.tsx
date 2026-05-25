import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider";
import { CartProvider } from "./contexts/CartProvider";
import { ProductProvider } from "./contexts/ProductProvider";
import { WishlistProvider } from "./contexts/WishlistProvider";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProductProvider>
          <WishlistProvider>
            <CartProvider>
              <AppRoutes />
            </CartProvider>
          </WishlistProvider>
        </ProductProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
