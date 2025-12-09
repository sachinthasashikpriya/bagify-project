import { useState } from "react";
import { AdminDashboard } from "./components/AdminDashboard";
import { BuyerDashboard } from "./components/BuyerDashboard";
import { CartPage } from "./components/CartPage";
import { Header } from "./components/Header";
import { HomePage } from "./components/HomePage";
import { LoginPage } from "./components/LoginPage";
import { ProductDetailPage } from "./components/ProductDetailPage";
import { SellerDashboard } from "./components/SellerDashboard";
import type { CartItem, Product, Review, Seller, User } from "./types";
import { mockBuyers, mockOrders, mockProducts, mockSellers } from "./types";

type Page =
  | "home"
  | "product"
  | "seller-dashboard"
  | "buyer-dashboard"
  | "admin-dashboard"
  | "login"
  | "cart";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState(mockOrders);

  const adminUser: User = {
    id: "admin1",
    name: "Admin User",
    email: "admin@bagmarket.com",
    type: "admin",
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.type === "seller") {
      setCurrentPage("seller-dashboard");
    } else if (user.type === "admin") {
      setCurrentPage("admin-dashboard");
    } else {
      setCurrentPage("home");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCartItems([]);
    setCurrentPage("home");
  };

  const handleViewProduct = (productId: string) => {
    setSelectedProductId(productId);
    setCurrentPage("product");
  };

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) =>
      prev.filter((item) => item.product.id !== productId)
    );
  };

  const handleCheckout = () => {
    if (cartItems.length === 0 || !currentUser) return;

    const newOrder = {
      id: `o${orders.length + 1}`,
      buyerId: currentUser.id,
      products: cartItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        image: item.product.image,
      })),
      totalAmount:
        cartItems.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        ) + 10,
      status: "pending" as const,
      orderDate: new Date().toISOString().split("T")[0],
      shippingAddress: currentUser.address || "123 Default St",
    };

    setOrders((prev) => [...prev, newOrder]);
    setCartItems([]);
    setCurrentPage("buyer-dashboard");
  };

  const handleAddProduct = (
    productData: Omit<
      Product,
      | "id"
      | "sellerId"
      | "sellerName"
      | "sellerRating"
      | "reviews"
      | "averageRating"
    >
  ) => {
    if (!currentUser || currentUser.type !== "seller") return;

    const seller = mockSellers.find((s) => s.id === currentUser.id) as Seller;
    const newProduct: Product = {
      ...productData,
      id: `p${products.length + 1}`,
      sellerId: currentUser.id,
      sellerName: seller.storeName,
      sellerRating: seller.rating,
      reviews: [],
      averageRating: 0,
    };

    setProducts((prev) => [...prev, newProduct]);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleAddReview = (
    productId: string,
    rating: number,
    comment: string
  ) => {
    if (!currentUser || currentUser.type !== "buyer") return;

    const newReview: Review = {
      id: `r${Math.random().toString(36).substr(2, 9)}`,
      productId,
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      rating,
      comment,
      date: new Date().toISOString().split("T")[0],
    };

    setProducts((prev) =>
      prev.map((product) => {
        if (product.id === productId) {
          const updatedReviews = [...product.reviews, newReview];
          const averageRating =
            updatedReviews.reduce((sum, r) => sum + r.rating, 0) /
            updatedReviews.length;
          return {
            ...product,
            reviews: updatedReviews,
            averageRating,
          };
        }
        return product;
      })
    );
  };

  const selectedProduct = selectedProductId
    ? products.find((p) => p.id === selectedProductId)
    : null;
  const currentUserOrders = currentUser
    ? orders.filter((o) => o.buyerId === currentUser.id)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {currentPage !== "login" && (
        <Header
          currentUser={currentUser}
          onNavigate={(page: string) => setCurrentPage(page as Page)}
          onLogout={handleLogout}
          cartItems={cartItems}
          currentPage={currentPage}
        />
      )}

      {currentPage === "login" && (
        <LoginPage
          onLogin={handleLogin}
          sellers={mockSellers}
          buyers={mockBuyers}
          admin={adminUser}
        />
      )}

      {currentPage === "home" && (
        <HomePage
          products={products}
          onViewProduct={handleViewProduct}
          onAddToCart={handleAddToCart}
          currentUser={currentUser}
        />
      )}

      {currentPage === "product" && selectedProduct && (
        <ProductDetailPage
          product={selectedProduct}
          onBack={() => setCurrentPage("home")}
          onAddToCart={handleAddToCart}
          onAddReview={handleAddReview}
          currentUser={currentUser}
        />
      )}

      {currentPage === "seller-dashboard" && currentUser?.type === "seller" && (
        <SellerDashboard
          seller={mockSellers.find((s) => s.id === currentUser.id) as Seller}
          products={products}
          onAddProduct={handleAddProduct}
          onDeleteProduct={handleDeleteProduct}
        />
      )}

      {currentPage === "buyer-dashboard" && currentUser?.type === "buyer" && (
        <BuyerDashboard buyer={currentUser} orders={currentUserOrders} />
      )}

      {currentPage === "admin-dashboard" && currentUser?.type === "admin" && (
        <AdminDashboard
          sellers={mockSellers}
          buyers={mockBuyers}
          products={products}
          orders={orders}
        />
      )}

      {currentPage === "cart" && (
        <CartPage
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveFromCart}
          onCheckout={handleCheckout}
          onContinueShopping={() => setCurrentPage("home")}
        />
      )}
    </div>
  );
}

export default App;
