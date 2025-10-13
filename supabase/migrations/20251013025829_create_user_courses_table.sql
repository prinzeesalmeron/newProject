/*
  # Create User Courses Table

  1. New Tables
    - `user_courses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `course_id` (uuid, foreign key to courses)
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)
      - `progress` (integer) - percentage 0-100
      - `last_accessed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on user_courses table
    - Users can only view/manage their own course enrollments
*/

-- Create user_courses table
CREATE TABLE IF NOT EXISTS user_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  last_accessed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

-- Users can view their own course enrollments
CREATE POLICY "Users can view own enrollments"
  ON user_courses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can enroll in courses
CREATE POLICY "Users can enroll in courses"
  ON user_courses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own course progress
CREATE POLICY "Users can update own progress"
  ON user_courses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own enrollments
CREATE POLICY "Users can delete own enrollments"
  ON user_courses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id ON user_courses(course_id);
