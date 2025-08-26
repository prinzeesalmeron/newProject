/*
  # Fix Users Table RLS Policies for Registration

  1. Security Changes
    - Drop existing problematic INSERT policies
    - Create new INSERT policy that allows authenticated users to create their own profile
    - Ensure the policy uses auth.uid() = id for proper user identification
    - Keep existing SELECT and UPDATE policies intact

  This fixes the "new row violates row-level security policy" error during user registration.
*/

-- Drop existing INSERT policies that might be causing conflicts
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON users;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON users;

-- Create a proper INSERT policy for authenticated users
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;