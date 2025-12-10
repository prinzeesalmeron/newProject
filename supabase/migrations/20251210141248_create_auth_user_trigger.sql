/*
  # Create Auth User Trigger

  1. Overview
    - Add trigger to automatically create user profile when auth user signs up
    - Ensures referential integrity between auth.users and public.users
    - Handles profile creation errors gracefully

  2. Changes
    - Create trigger function `on_auth_user_created`
    - Attach trigger to `auth.users` table on INSERT
    - Automatically creates corresponding record in `public.users` table

  3. Security
    - Trigger runs with elevated permissions to bypass RLS
    - Only creates records for new auth users
    - No manual intervention required
*/

DO $$
BEGIN
  -- Create or replace trigger function
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  SECURITY DEFINER
  SET search_path = public
  LANGUAGE plpgsql
  AS $function$
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      full_name,
      kyc_status,
      role,
      wallet_balance,
      total_portfolio_value,
      is_active
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'pending',
      'investor',
      0,
      0,
      TRUE
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
  END;
  $function$;

  -- Drop existing trigger if it exists
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

  -- Create trigger
  CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

  RAISE NOTICE 'Auth user trigger created successfully';
END $$;
