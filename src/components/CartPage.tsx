import { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { orderService } from '../services/orderService';
import { ConfirmModal } from './common/ConfirmModal';

export function CartPage() {
  const { currentUser } = useAuth();
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Check if user is logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-sm text-center max-w-md">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please Login</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view your cart.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }
    try {
      setUpdatingItems(prev => new Set(prev).add(productId));
      await updateQuantity(productId, newQuantity);
    } catch (error) {
      toast.error('Failed to update quantity');
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const handleRemoveItem = (productId: string) => {
    const item = cartItems.find(item => item.product.id === productId);
    if (!item) return;

    setConfirmModal({
      isOpen: true,
      title: 'Remove Item',
      message: `Are you sure you want to remove "${item.product.name}" from your cart?`,
      confirmText: 'Remove',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setUpdatingItems(prev => new Set(prev).add(productId));
          await removeFromCart(productId);
          toast.success('Item removed from cart');
        } catch (error) {
          toast.error('Failed to remove item');
        } finally {
          setUpdatingItems(prev => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
        }
      }
    });
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Clear Cart',
      message: 'Are you sure you want to clear your entire cart? This action cannot be undone.',
      confirmText: 'Clear Cart',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await clearCart();
          toast.success('Cart cleared');
        } catch (error) {
          toast.error('Failed to clear cart');
        }
      }
    });
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (currentUser.role !== 'BUYER') {
      toast.error('Only BUYERs can checkout');
      return;
    }

    setIsCheckingOut(true);
    
    const address = currentUser.address;
    const phone = currentUser.phone;
    
    if (!address || address.trim() === '' || !phone || phone.trim() === '') {
      toast.error('Please add your shipping address and mobile number in your profile to proceed with checkout.');
      setIsCheckingOut(false);
      navigate('/edit-profile');
      return;
    }
    
    try {
      const checkoutItems = cartItems.map(item => ({
        productId: Number(item.product.id),
        quantity: item.quantity
      }));

      const response = await orderService.placeOrder(address, checkoutItems);
      
      if (response.error) {
        toast.error(response.error);
        return;
      }
      
      if (response.data) {
        await clearCart();
        toast.success('Order placed successfully! Thank you for your purchase.');
        navigate(`/orders/${response.data.id}/confirmation`);
      }
    } catch (error: any) { 
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || error.message || 'Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shipping = subtotal >= 100 ? 0 : 10;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
          
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items to your cart yet. Start exploring our amazing collection!
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">
                  Shopping Cart ({cartItems.length} items)
                </h1>
                <button
                  onClick={handleClearCart}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Clear Cart
                </button>
              </div>

              <div className="p-6 space-y-4">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-20 h-20 rounded-lg object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/80x80?text=No+Image';
                      }}
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{item.product.name}</h3>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.product.description}</p>
                      <p className="text-purple-600 font-semibold">Rs. {item.product.price.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors disabled:opacity-50"
                        disabled={isCheckingOut || updatingItems.has(item.product.id)}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors disabled:opacity-50"
                        disabled={isCheckingOut || updatingItems.has(item.product.id) || item.quantity >= item.product.stock}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <p className="font-semibold text-gray-900">
                        Rs. {(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.product.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      disabled={isCheckingOut || updatingItems.has(item.product.id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>Rs. {subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `Rs. ${shipping.toFixed(2)}`}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>Rs. {tax.toFixed(2)}</span>
                </div>
                
                {shipping === 0 && (
                  <p className="text-sm text-green-600 font-medium">
                    🎉 Free shipping on orders over Rs. 100!
                  </p>
                )}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>Rs. {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || cartItems.length === 0 || currentUser.role !== 'BUYER'}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
              </button>

              {currentUser.role !== 'BUYER' && (
                <p className="text-center text-sm text-red-600 mt-3">
                  Only BUYERs can checkout
                </p>
              )}

              <div className="mt-6 text-sm text-gray-600">
                <p className="mb-2">🔒 Secure checkout with SSL encryption</p>
                <p className="mb-2">📦 Free returns within 30 days</p>
                <p>🚚 Fast delivery in 2-5 business days</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDestructive={confirmModal.isDestructive}
      />
    </div>
  );
}