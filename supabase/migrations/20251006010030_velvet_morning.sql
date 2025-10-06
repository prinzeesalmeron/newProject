/*
  # Fix duplicate policy error

  1. Policy Management
    - Drop existing duplicate policy if it exists
    - Recreate policy with proper conditions
    - Ensure no conflicts with existing policies

  2. Security
    - Maintain RLS protection
    - Ensure users can only view their own transactions
    - Add admin access for management

  3. Changes
    - Remove duplicate policy safely
    - Recreate with updated conditions
    - Add proper error handling
*/

-- Drop the existing policy if it exists (safe operation)
DROP POLICY IF EXISTS "Users can view their own payment transactions" ON payment_transactions;

-- Drop any other potentially conflicting policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON payment_transactions;
DROP POLICY IF EXISTS "View own payment transactions" ON payment_transactions;

-- Create the policy with proper conditions
CREATE POLICY "Users can view their own payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add admin access policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payment_transactions' 
    AND policyname = 'Admins can view all payment transactions'
  ) THEN
    CREATE POLICY "Admins can view all payment transactions"
      ON payment_transactions
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role = 'admin'
        )
      );
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;