-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Storage policies for product images
CREATE POLICY "Anyone can view product images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' AND
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update product images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'product-images' AND
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete product images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'product-images' AND
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Add payment fields to orders table
ALTER TABLE public.orders 
ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN payment_method TEXT,
ADD COLUMN razorpay_order_id TEXT,
ADD COLUMN razorpay_payment_id TEXT;

-- Add brand field to products for filtering
ALTER TABLE public.products
ADD COLUMN brand TEXT;