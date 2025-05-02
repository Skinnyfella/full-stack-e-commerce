import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { cartService } from '../services/cartService';
import { toast } from 'react-hot-toast';

// Create context
const CartContext = createContext();

// Context provider component
export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], itemCount: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // Add local storage cache for cart
  const saveCartToCache = (cartData) => {
    localStorage.setItem('cartCache', JSON.stringify({
      data: cartData,
      timestamp: Date.now()
    }));
  };

  const loadCartFromCache = () => {
    const cached = localStorage.getItem('cartCache');
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache valid for 5 minutes
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return data;
      }
    }
    return null;
  };

  // Load cart with cache
  const loadCart = useCallback(async () => {
    try {
      // Try to load from cache first
      const cachedCart = loadCartFromCache();
      if (cachedCart) {
        setCart(cachedCart);
        setLoading(false);
      }

      // Load fresh data
      const data = await cartService.getCartItems();
      setCart(data);
      saveCartToCache(data);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Optimistic update helper
  const optimisticUpdate = (updateFn) => {
    const previousCart = { ...cart };
    try {
      // Update UI immediately
      const newCart = updateFn(previousCart);
      setCart(newCart);
      saveCartToCache(newCart);
      return previousCart;
    } catch (error) {
      return previousCart;
    }
  };

  // Add to cart with optimistic update
  const addToCart = async (productId, quantity = 1) => {
    const previousCart = optimisticUpdate(cart => {
      const existingItem = cart.items.find(item => item.product.id === productId);
      if (existingItem) {
        return {
          ...cart,
          items: cart.items.map(item =>
            item.product.id === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        };
      }
      // Assume success and add placeholder item
      return {
        ...cart,
        items: [...cart.items, { 
          id: 'temp_' + Date.now(),
          quantity,
          product: { id: productId }
        }]
      };
    });

    try {
      await cartService.addToCart(productId, quantity);
      loadCart(); // Refresh cart to get accurate data
    } catch (error) {
      setCart(previousCart); // Revert on failure
      throw error;
    }
  };

  // Update cart item quantity with optimistic update
  const updateCartItem = async (cartItemId, quantity) => {
    const previousCart = optimisticUpdate(cart => {
      return {
        ...cart,
        items: cart.items.map(item =>
          item.id === cartItemId
            ? { ...item, quantity }
            : item
        )
      };
    });

    try {
      await cartService.updateCartItem(cartItemId, quantity);
      loadCart(); // Refresh cart to get accurate data
    } catch (error) {
      setCart(previousCart); // Revert on failure
      throw error;
    }
  };

  // Remove item from cart with optimistic update
  const removeFromCart = async (cartItemId) => {
    const previousCart = optimisticUpdate(cart => {
      return {
        ...cart,
        items: cart.items.filter(item => item.id !== cartItemId)
      };
    });

    try {
      await cartService.removeFromCart(cartItemId);
      loadCart(); // Refresh cart to get accurate data
    } catch (error) {
      setCart(previousCart); // Revert on failure
      throw error;
    }
  };

  // Clear entire cart with optimistic update
  const clearCart = async () => {
    const previousCart = optimisticUpdate(cart => {
      return { items: [], itemCount: 0, total: 0 };
    });

    try {
      await cartService.clearCart();
      loadCart(); // Refresh cart to get accurate data
    } catch (error) {
      setCart(previousCart); // Revert on failure
      throw error;
    }
  };

  const value = {
    cart,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refresh: loadCart
  };

  return (
    <CartContext.Provider value={value}>
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