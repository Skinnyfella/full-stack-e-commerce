import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { cartService } from '../services/cartService';

// Create context
const CartContext = createContext();

// Context provider component
export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], itemCount: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // Load cart items when user is authenticated
  useEffect(() => {
    const loadCart = async () => {
      if (isAuthenticated && user) {
        setLoading(true);
        try {
          const cartData = await cartService.getCartItems();
          setCart(cartData);
        } catch (error) {
          console.error('Error loading cart:', error);
        } finally {
          setLoading(false);
        }
      } else {
        // Reset cart if not authenticated
        setCart({ items: [], itemCount: 0, total: 0 });
        setLoading(false);
      }
    };

    loadCart();
  }, [isAuthenticated, user]);

  // Add item to cart
  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      // Handle unauthenticated users
      return;
    }

    setLoading(true);
    try {
      const updatedCart = await cartService.addToCart(productId, quantity);
      setCart(updatedCart);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update cart item quantity
  const updateCartItem = async (cartItemId, quantity) => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const updatedCart = await cartService.updateCartItem(cartItemId, quantity);
      setCart(updatedCart);
    } catch (error) {
      console.error('Error updating cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (cartItemId) => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const updatedCart = await cartService.removeFromCart(cartItemId);
      setCart(updatedCart);
    } catch (error) {
      console.error('Error removing from cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const emptyCart = await cartService.clearCart();
      setCart(emptyCart);
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider 
      value={{ 
        cart, 
        loading, 
        addToCart, 
        updateCartItem, 
        removeFromCart, 
        clearCart 
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use the cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 