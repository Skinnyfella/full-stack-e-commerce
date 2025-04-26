import { supabase } from '../utils/supabase';
import { toast } from 'react-hot-toast';

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
        .select(`
          id, 
          quantity, 
          product:product_id (
            id, 
            name, 
            price, 
            image_url, 
            inventory,
            sku,
            description
          )
        `)
        .eq('user_id', user.user.id);
      
      if (error) throw error;
      
      // Format data for frontend use
      const formattedItems = data.map(item => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          imageUrl: item.product.image_url,
          inventory: item.product.inventory,
          sku: item.product.sku,
          description: item.product.description
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
      console.log('Adding product to cart:', { productId, quantity });
      
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('Not authenticated');
      }
      
      console.log('Current user ID:', user.user.id);
      
      // Check if product exists in the database first
      const { data: productExists, error: productCheckError } = await supabase
        .from('products')
        .select('id, name')
        .eq('id', productId)
        .single();
        
      if (productCheckError) {
        console.error('Error checking product:', productCheckError);
        if (productCheckError.code === 'PGRST116') {
          console.log('Product not found with ID:', productId);
        }
        toast.error('Product not found in database');
        throw new Error('Product check failed');
      }
      
      if (!productExists) {
        console.log('Product exists check failed for ID:', productId);
        toast.error('Product not found');
        throw new Error('Product not found');
      }
      
      console.log('Product found:', productExists);
      
      // Check if product already in cart
      const { data: existingItem, error: existingItemError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.user.id)
        .eq('product_id', productId)
        .single();
      
      if (existingItemError && existingItemError.code !== 'PGRST116') {
        console.error('Error checking cart:', existingItemError);
        throw existingItemError;
      }
      
      if (existingItem) {
        // Update quantity if already in cart
        const { error } = await supabase
          .from('cart_items')
          .update({ 
            quantity: existingItem.quantity + quantity,
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
      toast.error('Failed to add item to cart');
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
      
      return await this.getCartItems();
    } catch (error) {
      console.error('Error updating cart item:', error);
      toast.error('Failed to update cart');
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