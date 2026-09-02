-- Migration 004: Populate Academic Calendar Data (AY 2026-27 Odd Semester) for P. P. Savani University

-- We use a DO block or CTE to fetch the PPSU campus ID dynamically so it correctly links to PPSU only.

DO $$
DECLARE
  ppsu_id UUID;
BEGIN
  -- Fetch the campus_id for PP Savani University
  SELECT id INTO ppsu_id FROM campuses WHERE short_name = 'PPSU' LIMIT 1;

  IF ppsu_id IS NOT NULL THEN
    
    -- 1. Single Day Holidays
    INSERT INTO academic_calendar (campus_id, event_date, event_type, event_name, semester_start, semester_end)
    VALUES 
      (ppsu_id, '2026-06-26', 'HOLIDAY', 'MUHARRAM', '2026-06-08', '2026-10-03'),
      (ppsu_id, '2026-08-15', 'HOLIDAY', 'INDEPENDENCE DAY', '2026-06-08', '2026-10-03'),
      (ppsu_id, '2026-08-28', 'HOLIDAY', 'RAKSHA BANDHAN', '2026-06-08', '2026-10-03'),
      (ppsu_id, '2026-09-04', 'HOLIDAY', 'JANMASHTAMI', '2026-06-08', '2026-10-03'),
      (ppsu_id, '2026-09-14', 'HOLIDAY', 'SAMVATSARI (GANESH CHATURTHI)', '2026-06-08', '2026-10-03'),
      (ppsu_id, '2026-09-25', 'HOLIDAY', 'GANESH VISARJAN', '2026-06-08', '2026-10-03'),
      (ppsu_id, '2026-10-02', 'HOLIDAY', 'GANDHI JAYANTI', '2026-06-08', '2026-10-03'),
      (ppsu_id, '2026-10-20', 'HOLIDAY', 'DUSSHERA', '2026-06-08', '2026-10-03'),
      (ppsu_id, '2026-12-25', 'HOLIDAY', 'CHRISTMAS', '2026-06-08', '2026-10-03');

    -- 2. Diwali Break (Vacation)
    INSERT INTO academic_calendar (campus_id, event_date, event_type, event_name, semester_start, semester_end)
    SELECT 
      ppsu_id, d::date, 'VACATION', 'Diwali Break', '2026-06-08', '2026-10-03'
    FROM generate_series('2026-11-07'::date, '2026-11-21'::date, '1 day'::interval) d;

    -- 3. 1st Internal Exam
    INSERT INTO academic_calendar (campus_id, event_date, event_type, event_name, semester_start, semester_end)
    SELECT 
      ppsu_id, d::date, 'EXAM', '1st Internal Exam', '2026-06-08', '2026-10-03'
    FROM generate_series('2026-07-27'::date, '2026-08-01'::date, '1 day'::interval) d;

    -- 4. 2nd Internal Exam
    INSERT INTO academic_calendar (campus_id, event_date, event_type, event_name, semester_start, semester_end)
    SELECT 
      ppsu_id, d::date, 'EXAM', '2nd Internal Exam', '2026-06-08', '2026-10-03'
    FROM generate_series('2026-09-14'::date, '2026-09-19'::date, '1 day'::interval) d;

    -- 5. Internal Practical Exams + Submission
    INSERT INTO academic_calendar (campus_id, event_date, event_type, event_name, semester_start, semester_end)
    SELECT 
      ppsu_id, d::date, 'EXAM', 'Internal Practical Exams', '2026-06-08', '2026-10-03'
    FROM generate_series('2026-09-28'::date, '2026-10-03'::date, '1 day'::interval) d;

  END IF;
END $$;
