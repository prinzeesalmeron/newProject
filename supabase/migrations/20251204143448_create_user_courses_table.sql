/*
  # Create user_courses table

  1. New Tables
    - `user_courses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `course_id` (uuid, foreign key to courses)
      - `started_at` (timestamp)
      - `progress` (integer, 0-100)
      - `completed_at` (timestamp, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_courses` table
    - Add policy for users to manage their own course progress
*/

CREATE TABLE IF NOT EXISTS user_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own course progress"
  ON user_courses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create course progress"
  ON user_courses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own course progress"
  ON user_courses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own course progress"
  ON user_courses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
