-- Add Suggestic user tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suggestic_user_id text,
ADD COLUMN IF NOT EXISTS suggestic_jwt_token text,
ADD COLUMN IF NOT EXISTS suggestic_jwt_expires_at timestamp with time zone;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_suggestic_user_id ON public.profiles(suggestic_user_id);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.suggestic_user_id IS 'Suggestic platform user ID for personalized meal plans and shopping lists';
COMMENT ON COLUMN public.profiles.suggestic_jwt_token IS 'JWT token for authenticated Suggestic API calls';
COMMENT ON COLUMN public.profiles.suggestic_jwt_expires_at IS 'Expiration timestamp for the JWT token';