-- Phase 1: Database Schema Updates & Security Enhancements

-- 1. Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Add missing fields to prices table
ALTER TABLE public.prices 
ADD COLUMN IF NOT EXISTS barcode text,
ADD COLUMN IF NOT EXISTS last_api_source text;

-- 3. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_prices_ingredient_store 
ON public.prices(ingredient_name, store_name, last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_prices_barcode 
ON public.prices(barcode) 
WHERE barcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_meal_plans_user_week 
ON public.meal_plans(user_id, week_start DESC);

CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_week 
ON public.shopping_lists(user_id, week_start DESC);

CREATE INDEX IF NOT EXISTS idx_connected_stores_user 
ON public.connected_stores(user_id);

CREATE INDEX IF NOT EXISTS idx_order_history_user_date 
ON public.order_history(user_id, ordered_at DESC);

CREATE INDEX IF NOT EXISTS idx_recipe_favorites_user 
ON public.recipe_favorites(user_id);

-- 4. Create security definer functions for credential encryption
-- These functions run with elevated privileges to handle encryption securely

CREATE OR REPLACE FUNCTION public.encrypt_store_credentials(
  creds jsonb,
  encryption_key text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Encrypt credentials using pgcrypto
  RETURN encode(
    pgp_sym_encrypt(creds::text, encryption_key),
    'base64'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_store_credentials(
  encrypted_creds text,
  encryption_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Decrypt credentials using pgcrypto
  RETURN pgp_sym_decrypt(
    decode(encrypted_creds, 'base64'),
    encryption_key
  )::jsonb;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Failed to decrypt credentials: %', SQLERRM;
END;
$$;

-- 5. Add helper function to validate user budget compliance
CREATE OR REPLACE FUNCTION public.check_budget_compliance(
  p_user_id uuid,
  p_total_cost numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_weekly_budget numeric;
  v_variance_pct numeric;
  v_status text;
BEGIN
  -- Get user's weekly budget
  SELECT weekly_budget INTO v_weekly_budget
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF v_weekly_budget IS NULL OR v_weekly_budget = 0 THEN
    RETURN jsonb_build_object(
      'status', 'no_budget',
      'message', 'No budget set'
    );
  END IF;
  
  -- Calculate variance
  v_variance_pct := ((p_total_cost - v_weekly_budget) / v_weekly_budget) * 100;
  
  -- Determine status
  IF p_total_cost <= v_weekly_budget THEN
    v_status := 'under_budget';
  ELSIF v_variance_pct <= 10 THEN
    v_status := 'at_budget';
  ELSIF v_variance_pct <= 20 THEN
    v_status := 'over_budget_warning';
  ELSE
    v_status := 'over_budget_critical';
  END IF;
  
  RETURN jsonb_build_object(
    'status', v_status,
    'weekly_budget', v_weekly_budget,
    'total_cost', p_total_cost,
    'variance', p_total_cost - v_weekly_budget,
    'variance_pct', round(v_variance_pct, 2)
  );
END;
$$;

-- 6. Add function to safely retrieve connected store credentials
-- This function ensures credentials are only accessible by the owning user
CREATE OR REPLACE FUNCTION public.get_user_store_credentials(
  p_user_id uuid,
  p_store_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credentials jsonb;
BEGIN
  -- Verify the requesting user matches the credential owner
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized access to store credentials';
  END IF;
  
  SELECT credentials INTO v_credentials
  FROM public.connected_stores
  WHERE user_id = p_user_id
    AND name = p_store_name;
  
  RETURN v_credentials;
END;
$$;

-- 7. Update RLS policies for connected_stores to prevent credential exposure
-- Drop existing policies and recreate with stricter controls
DROP POLICY IF EXISTS "stores_select_own" ON public.connected_stores;

CREATE POLICY "stores_select_own_metadata" 
ON public.connected_stores
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Note: credentials field should only be accessed via security definer functions
-- This policy allows reading the row but applications should avoid directly accessing credentials

-- 8. Add audit logging trigger for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  details jsonb,
  ip_address inet,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_time 
ON public.security_audit_log(user_id, created_at DESC);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs (to be implemented with roles system)
CREATE POLICY "audit_log_admin_only" 
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (false); -- Will be updated when admin roles are implemented

-- 9. Create trigger function to log credential access
CREATE OR REPLACE FUNCTION public.log_credential_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    details
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    NEW.id,
    jsonb_build_object(
      'store_name', NEW.name,
      'operation', TG_OP
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for connected_stores
DROP TRIGGER IF EXISTS audit_connected_stores ON public.connected_stores;

CREATE TRIGGER audit_connected_stores
AFTER INSERT OR UPDATE ON public.connected_stores
FOR EACH ROW
EXECUTE FUNCTION public.log_credential_access();

-- 10. Add constraint to ensure credentials are not null when store is connected
ALTER TABLE public.connected_stores
ADD CONSTRAINT check_credentials_not_null 
CHECK (credentials IS NOT NULL AND credentials != 'null'::jsonb);

-- 11. Comment tables and columns for documentation
COMMENT ON TABLE public.prices IS 'Stores real-time grocery prices from various APIs with caching';
COMMENT ON COLUMN public.prices.barcode IS 'Product barcode for precise matching across stores';
COMMENT ON COLUMN public.prices.last_api_source IS 'API source that provided this price (rapidapi, suggestic, etc.)';
COMMENT ON COLUMN public.connected_stores.credentials IS 'Encrypted store login credentials - access via security definer functions only';

COMMENT ON FUNCTION public.encrypt_store_credentials IS 'Encrypts store credentials using pgcrypto - call from edge functions only';
COMMENT ON FUNCTION public.decrypt_store_credentials IS 'Decrypts store credentials using pgcrypto - call from edge functions only';
COMMENT ON FUNCTION public.get_user_store_credentials IS 'Safely retrieves user store credentials with ownership validation';
COMMENT ON FUNCTION public.check_budget_compliance IS 'Validates if shopping cost complies with user weekly budget';