/*
  # Fix user registration RLS policy

  1. Security Updates
    - Update RLS policy to allow user registration
    - Ensure new users can create their profile during signup
    
  2. Changes
    - Modify the INSERT policy for users table to allow registration
    - Keep existing security for updates and selects
*/

-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Enable insert for authenticated users own profile" ON users;

-- Create a new policy that allows user registration
CREATE POLICY "Allow user registration and profile creation"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow users to create their own profile during registration
    auth.uid() = id
  );

-- Also allow unauthenticated users to insert during the registration process
-- This is needed because the user might not be fully authenticated when the profile is created
CREATE POLICY "Allow profile creation during registration"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- But we'll add a trigger to ensure only valid registrations can happen
CREATE OR REPLACE FUNCTION validate_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow insert if the user ID matches an existing auth user
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Invalid user registration: user must exist in auth.users';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to validate registrations
DROP TRIGGER IF EXISTS validate_user_registration_trigger ON users;
CREATE TRIGGER validate_user_registration_trigger
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_registration();