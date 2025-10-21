-- Add approval_comments to prescriptions table for storing comments on approved prescriptions
ALTER TABLE public.prescriptions 
ADD COLUMN IF NOT EXISTS approval_comments TEXT;