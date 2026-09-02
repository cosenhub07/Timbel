-- Migration 003: Smart Attendance Planner Schema

-- 1. student_attendance Table
CREATE TABLE IF NOT EXISTS student_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  campus_id UUID, -- Added for multi-campus support
  class_code TEXT NOT NULL,
  section TEXT DEFAULT '',
  subject TEXT NOT NULL,
  session_type TEXT DEFAULT 'LEC',
  present INT NOT NULL DEFAULT 0,
  absent INT NOT NULL DEFAULT 0,
  pending INT NOT NULL DEFAULT 0,
  no_attendance INT NOT NULL DEFAULT 0,
  required_percentage NUMERIC(5,2) DEFAULT 75.00,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one row per user per subject per session_type
  UNIQUE(user_id, subject, session_type, class_code)
);

ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attendance"
  ON student_attendance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attendance"
  ON student_attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance"
  ON student_attendance FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own attendance"
  ON student_attendance FOR DELETE
  USING (auth.uid() = user_id);

-- 2. academic_calendar Table
CREATE TABLE IF NOT EXISTS academic_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campus_id UUID,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL, -- 'HOLIDAY', 'VACATION', 'EXAM', 'HALF_DAY'
  event_name TEXT,
  affects_all BOOLEAN DEFAULT TRUE,
  affected_classes TEXT[],
  semester_start DATE,
  semester_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for academic_calendar: Anyone can read, only admin can write. 
-- (Assuming we just need read access for users for now)
ALTER TABLE academic_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for academic_calendar"
  ON academic_calendar FOR SELECT
  USING (true);

-- 3. attendance_exceptions Table
CREATE TABLE IF NOT EXISTS attendance_exceptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  campus_id UUID, -- Added for multi-campus support
  exception_date DATE NOT NULL,
  subject TEXT NOT NULL,
  session_type TEXT DEFAULT 'LEC',
  exception_type TEXT NOT NULL, -- 'CANCELLED', 'EXTRA'
  class_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE attendance_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own exceptions"
  ON attendance_exceptions FOR ALL
  USING (auth.uid() = user_id);
