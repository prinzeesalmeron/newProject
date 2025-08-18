/*
  # Fix users table RLS policy for signup

  1. Security Updates
    - Drop existing restrictive INSERT policy
    - Create new INSERT policy that allows authenticated users to insert their own profile
    - Ensure the policy works correctly during the signup flow
    - Keep existing SELECT and UPDATE policies intact

  2. Policy Changes
    - Allow INSERT for authenticated users where the user ID matches auth.uid()
    - This ensures users can only create their own profile during signup
*/

-- Drop the existing INSERT policy that might be too restrictive
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Create a new INSERT policy that works properly during signup
CREATE POLICY "Enable insert for authenticated users own profile" ON users
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Ensure the existing policies are still in place
DO $$
BEGIN
  -- Check if SELECT policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can read own data'
  ) THEN
    CREATE POLICY "Users can read own data" ON users
      FOR SELECT 
      TO authenticated 
      USING (auth.uid() = id);
  END IF;

  -- Check if UPDATE policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can update own data'
  ) THEN
    CREATE POLICY "Users can update own data" ON users
      FOR UPDATE 
      TO authenticated 
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;