-- Auto-assign prescriptions to first available pharmacist
CREATE OR REPLACE FUNCTION public.auto_assign_prescription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pharmacist_id uuid;
BEGIN
  -- Get the first pharmacist user
  SELECT user_id INTO v_pharmacist_id
  FROM public.user_roles
  WHERE role = 'pharmacist'::app_role
  LIMIT 1;
  
  -- Assign to pharmacist if one exists
  IF v_pharmacist_id IS NOT NULL THEN
    NEW.pharmacist_id := v_pharmacist_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign prescriptions
DROP TRIGGER IF EXISTS trigger_auto_assign_prescription ON public.prescriptions;
CREATE TRIGGER trigger_auto_assign_prescription
  BEFORE INSERT ON public.prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_prescription();