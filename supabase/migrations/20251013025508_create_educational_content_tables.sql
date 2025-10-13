/*
  # Create Educational Content Tables

  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `difficulty` (text) - beginner, intermediate, advanced
      - `duration` (text) - e.g., "4 weeks", "2 hours"
      - `rating` (numeric)
      - `students_count` (integer)
      - `topics` (text array)
      - `image_url` (text)
      - `is_featured` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `articles`
      - `id` (uuid, primary key)
      - `title` (text)
      - `excerpt` (text)
      - `content` (text)
      - `author` (text)
      - `category` (text)
      - `read_time` (text)
      - `published_date` (timestamptz)
      - `is_featured` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access
    - Add policies for authenticated admin users to manage content
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL DEFAULT 'Beginner',
  duration text NOT NULL,
  rating numeric DEFAULT 0,
  students_count integer DEFAULT 0,
  topics text[] DEFAULT '{}',
  image_url text,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  author text NOT NULL,
  category text NOT NULL,
  read_time text NOT NULL,
  published_date timestamptz DEFAULT now(),
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Policies for courses table
CREATE POLICY "Anyone can view courses"
  ON courses
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create courses"
  ON courses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update courses"
  ON courses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete courses"
  ON courses
  FOR DELETE
  TO authenticated
  USING (true);

-- Policies for articles table
CREATE POLICY "Anyone can view articles"
  ON articles
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create articles"
  ON articles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update articles"
  ON articles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete articles"
  ON articles
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert sample courses
INSERT INTO courses (title, description, difficulty, duration, rating, students_count, topics, image_url, is_featured)
VALUES 
  (
    'Real Estate Tokenization Fundamentals',
    'Learn the basics of blockchain-based real estate investing and tokenization',
    'Beginner',
    '4 weeks',
    4.8,
    12500,
    ARRAY['Blockchain Basics', 'Tokenization', 'Smart Contracts', 'Investment Strategy'],
    'https://images.pexels.com/photos/6863332/pexels-photo-6863332.jpeg?auto=compress&cs=tinysrgb&w=800',
    true
  ),
  (
    'Advanced Smart Contract Development',
    'Master smart contract development for real estate applications',
    'Advanced',
    '6 weeks',
    4.9,
    3200,
    ARRAY['Solidity', 'Security', 'Testing', 'Deployment'],
    'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800',
    false
  ),
  (
    'Property Analysis & Due Diligence',
    'Learn how to evaluate properties and make informed investment decisions',
    'Intermediate',
    '3 weeks',
    4.7,
    8900,
    ARRAY['Market Analysis', 'Financial Modeling', 'Risk Assessment', 'Legal Considerations'],
    'https://images.pexels.com/photos/7621140/pexels-photo-7621140.jpeg?auto=compress&cs=tinysrgb&w=800',
    false
  ),
  (
    'Passive Income Through Real Estate',
    'Build sustainable passive income streams with tokenized real estate',
    'Beginner',
    '2 weeks',
    4.6,
    15600,
    ARRAY['Rental Income', 'Portfolio Building', 'Tax Strategy', 'Long-term Planning'],
    'https://images.pexels.com/photos/6863183/pexels-photo-6863183.jpeg?auto=compress&cs=tinysrgb&w=800',
    false
  ),
  (
    'DeFi and Real Estate Integration',
    'Explore how DeFi protocols enhance real estate investing',
    'Advanced',
    '5 weeks',
    4.8,
    4100,
    ARRAY['DeFi Protocols', 'Liquidity Pools', 'Yield Farming', 'Risk Management'],
    'https://images.pexels.com/photos/8370752/pexels-photo-8370752.jpeg?auto=compress&cs=tinysrgb&w=800',
    false
  ),
  (
    'Portfolio Diversification Strategies',
    'Learn to build a diversified real estate portfolio with tokenized assets',
    'Intermediate',
    '3 weeks',
    4.7,
    7300,
    ARRAY['Asset Allocation', 'Risk Management', 'Market Trends', 'Rebalancing'],
    'https://images.pexels.com/photos/7621143/pexels-photo-7621143.jpeg?auto=compress&cs=tinysrgb&w=800',
    false
  );

-- Insert sample articles
INSERT INTO articles (title, excerpt, content, author, category, read_time, published_date, is_featured)
VALUES 
  (
    'The Future of Real Estate: Why Tokenization Matters',
    'Discover how blockchain technology is revolutionizing property ownership and making real estate accessible to everyone.',
    'Full article content about real estate tokenization and its impact on the market...',
    'Sarah Johnson',
    'Market Trends',
    '8 min read',
    now() - interval '2 days',
    true
  ),
  (
    '5 Key Metrics for Evaluating Tokenized Properties',
    'Learn the essential metrics every investor should analyze before purchasing property tokens.',
    'Full article content about key investment metrics...',
    'Michael Chen',
    'Investment Strategy',
    '6 min read',
    now() - interval '5 days',
    true
  ),
  (
    'Understanding Smart Contracts in Real Estate',
    'A comprehensive guide to how smart contracts automate and secure real estate transactions.',
    'Full article content about smart contracts...',
    'Emily Rodriguez',
    'Technology',
    '10 min read',
    now() - interval '1 week',
    false
  ),
  (
    'Tax Implications of Tokenized Real Estate',
    'Navigate the tax considerations when investing in blockchain-based real estate.',
    'Full article content about tax implications...',
    'David Williams',
    'Legal & Tax',
    '7 min read',
    now() - interval '3 days',
    false
  ),
  (
    'Building Passive Income with Property Tokens',
    'Step-by-step guide to generating consistent rental income through tokenized properties.',
    'Full article content about passive income...',
    'Lisa Anderson',
    'Income Generation',
    '9 min read',
    now() - interval '4 days',
    false
  ),
  (
    'Market Analysis: Q4 2025 Real Estate Outlook',
    'Comprehensive market analysis and predictions for the tokenized real estate sector.',
    'Full article content about market outlook...',
    'Robert Taylor',
    'Market Trends',
    '12 min read',
    now() - interval '1 day',
    false
  );
