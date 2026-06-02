-- Supabase Database Schema for LexiLearn

-- Users table extending Supabase auth
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  role text DEFAULT 'child' CHECK (role IN ('child', 'parent', 'teacher')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Reading Content
CREATE TABLE public.reading_content (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  content_text text NOT NULL,
  difficulty integer NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  audio_url text, -- For pre-recorded fallback audio
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Speech Practice Prompts
CREATE TABLE public.speech_practice (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  sentence text NOT NULL,
  difficulty integer NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  audio_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Speech Practice Results
CREATE TABLE public.speech_results (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  practice_id uuid REFERENCES public.speech_practice(id) ON DELETE CASCADE NOT NULL,
  recognized_text text,
  pronunciation_score float NOT NULL,
  recording_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Progress Tracking
CREATE TABLE public.progress (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  reading_accuracy float DEFAULT 0,
  speech_accuracy float DEFAULT 0,
  lessons_completed integer DEFAULT 0,
  total_points integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Achievements Library
CREATE TABLE public.achievements (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  points_required integer DEFAULT 0
);

-- User Achievements mapping
CREATE TABLE public.user_achievements (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speech_practice ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speech_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Content: Anyone logged in can read learning content
CREATE POLICY "Anyone can read content" ON public.reading_content FOR SELECT USING (true);
CREATE POLICY "Anyone can read practice prompts" ON public.speech_practice FOR SELECT USING (true);
CREATE POLICY "Anyone can read achievements library" ON public.achievements FOR SELECT USING (true);

-- Progress & Results: Users can only see/modify their own
CREATE POLICY "Users can view own results" ON public.speech_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own results" ON public.speech_results FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own progress" ON public.progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert/update own progress" ON public.progress FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert initial dummy data
INSERT INTO public.achievements (title, description, icon, points_required) VALUES
('First Steps', 'Complete your very first lesson', '🌟', 10),
('3 Day Streak', 'Practice for 3 days in a row', '🔥', 50),
('Loud & Clear', 'Get 100% pronunciation score', '🗣️', 100),
('Word Wizard', 'Complete 10 reading practices', '🧠', 200);
