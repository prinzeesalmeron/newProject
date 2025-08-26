/*
  # Create User Profile Trigger

  1. Function
    - Creates a function to automatically create user profile when auth user is created
    - Uses the user metadata from auth.users to populate the profile

  2. Trigger
    - Triggers on INSERT to auth.users table
    - Automatically creates corresponding row in public.users table

  3. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Only creates profile, doesn't modify existing ones
*/

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    phone,
    date_of_birth,
    address,
    kyc_status,
    role,
    block_balance,
    total_portfolio_value,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    CASE 
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::date 
      ELSE NULL 
    END,
    CASE 
      WHEN NEW.raw_user_meta_data->>'address' IS NOT NULL 
      THEN NEW.raw_user_meta_data->'address' 
      ELSE NULL 
    END,
    'pending',
    'investor',
    0,
    0,
    true,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to allow the trigger to work
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow user profile creation during signup" ON public.users;

-- Create a simple policy that allows authenticated users to insert their own profile
CREATE POLICY "Enable insert for authenticated users own profile" ON public.users
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Also allow the trigger function to insert (it runs as SECURITY DEFINER)
CREATE POLICY "Enable insert for service role" ON public.users
  FOR INSERT 
  TO service_role 
  WITH CHECK (true);