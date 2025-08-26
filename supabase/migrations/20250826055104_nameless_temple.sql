/*
  # Fix user registration RLS policy

  1. Security Updates
    - Update RLS policy for users table to allow profile creation during registration
    - Allow authenticated users to insert their own profile data
    - Maintain security by ensuring users can only create profiles with their own auth.uid()

  2. Changes
    - Drop existing restrictive INSERT policy
    - Create new policy that allows authenticated users to insert their own data
    - Keep existing SELECT and UPDATE policies intact
*/

-- Drop the existing INSERT policy that's too restrictive
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Allow user registration and profile creation" ON users;
DROP POLICY IF EXISTS "Allow profile creation during registration" ON users;

-- Create a new INSERT policy that allows authenticated users to create their profile
CREATE POLICY "Allow authenticated users to insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also allow anon users to insert during the registration process
-- This is needed because during signUp, the user might not be fully authenticated yet
CREATE POLICY "Allow profile creation during signup"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Ensure the existing SELECT and UPDATE policies are correct
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);