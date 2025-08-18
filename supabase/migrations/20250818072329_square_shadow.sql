/*
  # Create properties table

  1. New Tables
    - `properties`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text, optional)
      - `image_url` (text)
      - `location` (text)
      - `property_type` (text with enum constraint)
      - `price_per_token` (numeric)
      - `total_tokens` (integer)
      - `available_tokens` (integer)
      - `rental_yield` (numeric)
      - `projected_return` (numeric)
      - `rating` (numeric)
      - `features` (text array)
      - `is_yield_property` (boolean)
      - `yield_percentage` (text, optional)
      - `status` (text with enum constraint)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `properties` table
    - Add policy for public read access to active properties
*/

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  location text NOT NULL,
  property_type text NOT NULL CHECK (property_type IN ('Single Family', 'Multi Family', 'Commercial', 'Vacation Rentals', 'Cash Flowing')),
  price_per_token numeric NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  available_tokens integer NOT NULL DEFAULT 0,
  rental_yield numeric NOT NULL DEFAULT 0,
  projected_return numeric NOT NULL DEFAULT 0,
  rating numeric NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  features text[] DEFAULT '{}',
  is_yield_property boolean DEFAULT false,
  yield_percentage text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold_out', 'coming_soon')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Properties are viewable by everyone"
  ON properties
  FOR SELECT
  TO public
  USING (true);

-- Insert some sample data
INSERT INTO properties (
  title,
  description,
  image_url,
  location,
  property_type,
  price_per_token,
  total_tokens,
  available_tokens,
  rental_yield,
  projected_return,
  rating,
  features,
  is_yield_property,
  yield_percentage,
  status
) VALUES 
(
  'Modern Downtown Apartment Complex',
  'Premium apartment complex in the heart of downtown with excellent rental potential.',
  'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg',
  'New York, NY',
  'Multi Family',
  100,
  1000,
  750,
  8.5,
  12.3,
  4.8,
  ARRAY['Pool', 'Gym', 'Parking', 'Security'],
  true,
  '8.5%',
  'active'
),
(
  'Luxury Beach House',
  'Stunning beachfront property perfect for vacation rentals with high occupancy rates.',
  'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
  'Miami, FL',
  'Vacation Rentals',
  250,
  400,
  200,
  15.2,
  18.7,
  4.9,
  ARRAY['Beach Access', 'Pool', 'Hot Tub', 'Ocean View'],
  true,
  '15.2%',
  'active'
),
(
  'Commercial Office Building',
  'Prime commercial real estate in business district with long-term tenants.',
  'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg',
  'Chicago, IL',
  'Commercial',
  500,
  2000,
  1200,
  6.8,
  9.5,
  4.6,
  ARRAY['Elevator', 'Parking Garage', 'Conference Rooms', 'Security'],
  true,
  '6.8%',
  'active'
);