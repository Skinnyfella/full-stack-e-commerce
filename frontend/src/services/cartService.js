import { supabase } from '../utils/supabase';
import { toast } from 'react-hot-toast';

// Calculate product status based on stock quantity
const calculateProductStatus = (stock) => {
  if (!stock || stock === 0) return 'Out of Stock';
  if (stock <= 20) return 'Low Stock';
  return 'In Stock';
};

export const cartService = {
  // Get all cart items for the current user
  async getCartItems() {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('Not authenticated');
      }
      
      // Get cart items with product details
      const { data, error } = await supabase
        .from('cart_items')
        .select('id, quantity, product_id, products(id, name, price, image_url, stock_quantity, description, category)')
        .eq('user_id', user.user.id);

      if (error) throw error;
      
      // Format data for frontend use
      const formattedItems = (data || []).map(item => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.products.id,
          name: item.products.name,
          price: item.products.price,
          imageUrl: item.products.image_url,
          inventory: item.products.stock_quantity || 0,
          status: calculateProductStatus(item.products.stock_quantity),
          description: item.products.description,
          category: item.products.category
        }
      }));
      
      return {
        items: formattedItems,
        itemCount: formattedItems.length,
        total: formattedItems.reduce((sum, item) => 
          sum + (parseFloat(item.product.price) * item.quantity), 0)
      };
    } catch (error) {
      console.error('Error fetching cart items:', error);
      return { items: [], itemCount: 0, total: 0 };
    }
  },
  
  // Add an item to the cart
  async addToCart(productId, quantity = 1) {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('Not authenticated');
      }
      
      // Check if product exists and has stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, stock_quantity')
        .eq('id', productId)
        .single();
      
      if (productError) {
        console.error('Error checking product:', productError);
        toast.error('Product not found');
        throw new Error('Product check failed');
      }
      
      if (!product) {
        toast.error('Product not found');
        throw new Error('Product not found');
      }
      
      // Check stock quantity
      if (product.stock_quantity < quantity) {
        toast.error(`Only ${product.stock_quantity} items available`);
        throw new Error('Insufficient stock');
      }
      
      // Check if product already in cart
      const { data: existingItem, error: existingItemError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.user.id)
        .eq('product_id', productId)
        .single();
      
      if (existingItemError && existingItemError.code !== 'PGRST116') {
        throw existingItemError;
      }
      
      if (existingItem) {
        // Check if new total quantity exceeds stock
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock_quantity) {
          toast.error(`Cannot add more. Only ${product.stock_quantity} items available`);
          throw new Error('Insufficient stock');
        }
        
        // Update quantity if already in cart
        const { error } = await supabase
          .from('cart_items')
          .update({ 
            quantity: newQuantity,
            updated_at: new Date()
          })
          .eq('id', existingItem.id);
        
        if (error) throw error;
      } else {
        // Add new item if not in cart
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.user.id,
            product_id: productId,
            quantity
          });
        
        if (error) throw error;
      }
      
      toast.success('Item added to cart');
      return await this.getCartItems();
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (!error.message?.includes('stock')) {
        toast.error('Failed to add item to cart');
      }
      throw error;
    }
  },
  
  // Update cart item quantity
  async updateCartItem(cartItemId, quantity) {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('Not authenticated');
      }
      
      // Get current cart item to check product stock
      const { data: cartItem, error: cartError } = await supabase
        .from('cart_items')
        .select('product_id')
        .eq('id', cartItemId)
        .single();
        
      if (cartError) throw cartError;
      
      // Check product stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', cartItem.product_id)
        .single();
        
      if (productError) throw productError;
      
      if (quantity > product.stock_quantity) {
        toast.error(`Only ${product.stock_quantity} items available`);
        throw new Error('Insufficient stock');
      }
      
      // Update quantity
      const { error } = await supabase
        .from('cart_items')
        .update({ 
          quantity,
          updated_at: new Date()
        })
        .eq('id', cartItemId)
        .eq('user_id', user.user.id);
      
      if (error) throw error;
      
      toast.success('Cart updated');
      return await this.getCartItems();
    } catch (error) {
      console.error('Error updating cart item:', error);
      if (!error.message?.includes('stock')) {
        toast.error('Failed to update cart');
      }
      throw error;
    }
  },
  
  // Remove item from cart
  async removeFromCart(cartItemId) {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('Not authenticated');
      }
      
      // Delete the cart item
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)
        .eq('user_id', user.user.id);
      
      if (error) throw error;
      
      toast.success('Item removed from cart');
      return await this.getCartItems();
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
      throw error;
    }
  },
  
  // Clear entire cart
  async clearCart() {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('Not authenticated');
      }
      
      // Delete all user's cart items
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.user.id);
      
      if (error) throw error;
      
      toast.success('Cart cleared');
      return { items: [], itemCount: 0, total: 0 };
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
      throw error;
    }
  }
};