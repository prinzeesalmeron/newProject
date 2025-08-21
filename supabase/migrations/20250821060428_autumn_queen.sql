/*
  # Add INSERT policy for properties table

  1. Security Changes
    - Add policy to allow authenticated users to insert properties
    - Enables property creation functionality for logged-in users

  This resolves the "new row violates row-level security policy" error
  by granting INSERT permissions to authenticated users.
*/

CREATE POLICY "Authenticated users can insert properties"
  ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (true);