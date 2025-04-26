-- Create orders table with relations to users and shipping addresses
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_name TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    shipping DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    shipping_address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create order items table with relations to orders and products
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on orders tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Orders table policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
FOR SELECT USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
CREATE POLICY "Users can create their own orders" ON public.orders
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can update their own orders" ON public.orders
FOR UPDATE USING (user_id = auth.uid() OR is_admin());

-- Order items policies
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
CREATE POLICY "Users can view their own order items" ON public.order_items
FOR SELECT USING (
  order_id IN (
    SELECT id FROM public.orders 
    WHERE user_id = auth.uid()
  ) OR is_admin()
);

DROP POLICY IF EXISTS "Users can create their own order items" ON public.order_items;
CREATE POLICY "Users can create their own order items" ON public.order_items
FOR INSERT WITH CHECK (
  order_id IN (
    SELECT id FROM public.orders 
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can update order items" ON public.order_items;
CREATE POLICY "Admins can update order items" ON public.order_items
FOR UPDATE USING (is_admin()); 