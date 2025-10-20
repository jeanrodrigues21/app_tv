/*
  # Dorama Streaming Platform Database Schema

  ## Overview
  Complete database schema for a Netflix-style dorama streaming platform with authentication,
  content management, watch progress tracking, and user preferences.

  ## Tables Created

  ### 1. profiles
  Extends auth.users with additional user information
  - `id` (uuid, FK to auth.users)
  - `email` (text)
  - `display_name` (text)
  - `avatar_url` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. doramas
  Stores dorama series information
  - `id` (uuid, PK)
  - `title` (text)
  - `description` (text)
  - `poster_url` (text)
  - `banner_url` (text)
  - `year` (integer)
  - `country` (text)
  - `rating` (numeric)
  - `total_episodes` (integer)
  - `status` (text: ongoing/completed)
  - `genres` (text array)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. episodes
  Stores individual episode information
  - `id` (uuid, PK)
  - `dorama_id` (uuid, FK)
  - `episode_number` (integer)
  - `title` (text)
  - `description` (text)
  - `thumbnail_url` (text)
  - `video_url` (text)
  - `duration_seconds` (integer)
  - `intro_start` (integer, seconds)
  - `intro_end` (integer, seconds)
  - `outro_start` (integer, seconds)
  - `created_at` (timestamptz)

  ### 4. watch_progress
  Tracks user viewing progress
  - `id` (uuid, PK)
  - `user_id` (uuid, FK)
  - `episode_id` (uuid, FK)
  - `dorama_id` (uuid, FK)
  - `progress_seconds` (integer)
  - `completed` (boolean)
  - `last_watched` (timestamptz)

  ### 5. my_list
  User's saved doramas list
  - `id` (uuid, PK)
  - `user_id` (uuid, FK)
  - `dorama_id` (uuid, FK)
  - `added_at` (timestamptz)

  ### 6. user_preferences
  User settings and preferences
  - `id` (uuid, PK)
  - `user_id` (uuid, FK)
  - `auto_skip_intro` (boolean)
  - `auto_skip_outro` (boolean)
  - `auto_play_next` (boolean)
  - `video_quality` (text)
  - `subtitle_language` (text)

  ## Security
  - RLS enabled on all tables
  - Policies ensure users can only access their own data
  - Public read access for dorama and episode content
  - Authenticated users can manage their own watch progress and lists
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create doramas table
CREATE TABLE IF NOT EXISTS doramas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  poster_url text,
  banner_url text,
  year integer,
  country text DEFAULT 'Korea',
  rating numeric(3,1) DEFAULT 0,
  total_episodes integer DEFAULT 0,
  status text DEFAULT 'ongoing',
  genres text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE doramas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view doramas"
  ON doramas FOR SELECT
  TO authenticated
  USING (true);

-- Create episodes table
CREATE TABLE IF NOT EXISTS episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dorama_id uuid REFERENCES doramas(id) ON DELETE CASCADE NOT NULL,
  episode_number integer NOT NULL,
  title text,
  description text,
  thumbnail_url text,
  video_url text NOT NULL,
  duration_seconds integer DEFAULT 0,
  intro_start integer DEFAULT 0,
  intro_end integer DEFAULT 0,
  outro_start integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(dorama_id, episode_number)
);

ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view episodes"
  ON episodes FOR SELECT
  TO authenticated
  USING (true);

-- Create watch_progress table
CREATE TABLE IF NOT EXISTS watch_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  episode_id uuid REFERENCES episodes(id) ON DELETE CASCADE NOT NULL,
  dorama_id uuid REFERENCES doramas(id) ON DELETE CASCADE NOT NULL,
  progress_seconds integer DEFAULT 0,
  completed boolean DEFAULT false,
  last_watched timestamptz DEFAULT now(),
  UNIQUE(user_id, episode_id)
);

ALTER TABLE watch_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watch progress"
  ON watch_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watch progress"
  ON watch_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watch progress"
  ON watch_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watch progress"
  ON watch_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create my_list table
CREATE TABLE IF NOT EXISTS my_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dorama_id uuid REFERENCES doramas(id) ON DELETE CASCADE NOT NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE(user_id, dorama_id)
);

ALTER TABLE my_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own list"
  ON my_list FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own list"
  ON my_list FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own list"
  ON my_list FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  auto_skip_intro boolean DEFAULT true,
  auto_skip_outro boolean DEFAULT false,
  auto_play_next boolean DEFAULT true,
  video_quality text DEFAULT 'auto',
  subtitle_language text DEFAULT 'pt-BR',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_episodes_dorama_id ON episodes(dorama_id);
CREATE INDEX IF NOT EXISTS idx_watch_progress_user_id ON watch_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_progress_dorama_id ON watch_progress(dorama_id);
CREATE INDEX IF NOT EXISTS idx_watch_progress_last_watched ON watch_progress(last_watched DESC);
CREATE INDEX IF NOT EXISTS idx_my_list_user_id ON my_list(user_id);
CREATE INDEX IF NOT EXISTS idx_doramas_genres ON doramas USING gin(genres);
