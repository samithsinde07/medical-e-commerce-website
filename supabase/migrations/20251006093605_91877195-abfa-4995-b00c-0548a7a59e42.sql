-- Add approval_comments to prescriptions table
ALTER TABLE public.prescriptions 
ADD COLUMN IF NOT EXISTS approval_comments TEXT;