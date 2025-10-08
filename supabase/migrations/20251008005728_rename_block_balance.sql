/*
  # Rename block_balance to wallet_balance

  1. Changes
    - Rename column `block_balance` to `wallet_balance` in users table
    - This removes BLOCK token terminology from the system
    - Updates to use standard wallet balance terminology

  2. Security
    - No changes to RLS policies needed
    - Column rename maintains all existing constraints and defaults
*/

-- Rename block_balance to wallet_balance in users table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'block_balance'
  ) THEN
    ALTER TABLE users RENAME COLUMN block_balance TO wallet_balance;
  END IF;
END $$;
