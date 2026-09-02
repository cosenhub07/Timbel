const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');

const router = express.Router();

// ─── Supabase client (lazy init) ──────────────────────────────────────────────
let supabase;
function getSupabase(token) {
  if (token) {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
  }
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return supabase;
}

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
}

// ─── AI client (lazy init) ────────────────────────────────────────────────────
let ai;
function getAI() {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
const DAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function getDayAbbr(dateObj) {
  return DAY_ABBR[dateObj.getDay()];
}

function addDays(dateObj, n) {
  const d = new Date(dateObj);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(dateObj) {
  return dateObj.toISOString().split('T')[0];
}

function formatDate(dateObj) {
  return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Core Attendance Calculations ─────────────────────────────────────────────

function calculateCurrent(record) {
  const present = record.present || 0;
  const absent = record.absent || 0;
  const pending = record.pending || 0;
  const totalCounted = present + absent;
  const currentPct = totalCounted > 0 ? (present / totalCounted) * 100 : 0;
  const totalWithPending = totalCounted + pending;
  const bestCase = totalWithPending > 0 ? ((present + pending) / totalWithPending) * 100 : currentPct;
  const worstCase = totalWithPending > 0 ? (present / totalWithPending) * 100 : currentPct;
  return { current: currentPct, range: { best: bestCase, worst: worstCase }, pendingCount: pending };
}

function computeRequiredAndSafe(record) {
  const reqPct = (record.required_percentage || 75) / 100;
  const present = record.present || 0;
  const absent = record.absent || 0;
  const total = present + absent;
  const num = reqPct * total - present;
  const den = 1 - reqPct;
  const requiredToAttend = num > 0 ? Math.ceil(num / den) : 0;
  const maxAbs = Math.floor(present / reqPct - total);
  const safeBunks = maxAbs > 0 ? maxAbs : 0;
  const status = requiredToAttend > 0 ? 'DANGER' : (safeBunks <= 2 ? 'WARNING' : 'SAFE');
  return { requiredToAttend, safeBunks, status };
}

// ─── Projection Engine ─────────────────────────────────────────────────────────
/**
 * Walk the calendar from today to semesterEnd.
 * CANCELLED exceptions: those dates are added to the per-subject holidaySet.
 * EXTRA exceptions: extra lecture dates are injected into the result.
 *
 * @param {Array} timetableSlots - slots for this subject/session
 * @param {Set<string>} holidaySet - 'YYYY-MM-DD' dates that are non-teaching (includes CANCELLED exceptions)
 * @param {Date} semesterEnd
 * @param {Array} extraDates - [{dateStr, day, formatted}] EXTRA exception lectures
 */
function projectFutureLectures(timetableSlots, holidaySet, semesterEnd, extraDates = []) {
  const futureLectures = [];
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(semesterEnd);
  end.setHours(23, 59, 59, 999);

  while (cursor <= end) {
    const dayAbbr = getDayAbbr(cursor);
    const dateStr = toDateStr(cursor);

    if (!holidaySet.has(dateStr)) {
      const matchingSlots = timetableSlots.filter(s => s.day === dayAbbr);
      for (const slot of matchingSlots) {
        futureLectures.push({
          date: new Date(cursor),
          dateStr,
          day: dayAbbr,
          start_time: slot.start_time,
          formatted: formatDate(cursor),
          isExtra: false
        });
      }
    }

    cursor = addDays(cursor, 1);
  }

  // Inject EXTRA lectures not already present
  for (const extra of extraDates) {
    if (!futureLectures.find(l => l.dateStr === extra.dateStr)) {
      const dt = new Date(extra.dateStr);
      futureLectures.push({
        date: dt,
        dateStr: extra.dateStr,
        day: getDayAbbr(dt),
        start_time: null,
        formatted: formatDate(dt),
        isExtra: true
      });
    }
  }

  // Sort chronologically
  futureLectures.sort((a, b) => a.date - b.date);

  return futureLectures;
}

function findRecoveryDate(futureLectures, requiredToAttend) {
  if (requiredToAttend <= 0 || futureLectures.length === 0) return null;
  if (futureLectures.length < requiredToAttend) return null;
  return futureLectures[requiredToAttend - 1];
}

function findSafeBunkDates(futureLectures, safeBunks) {
  if (safeBunks <= 0) return [];
  return futureLectures.filter(l => !l.isExtra).slice(0, Math.min(safeBunks, 5));
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/attendance/save
 */
router.post('/save', async (req, res) => {
  try {
    const {
      user_id, campus_id, class_code, section,
      subject, session_type, present, absent, pending, no_attendance,
      required_percentage
    } = req.body;

    if (!user_id || !class_code || !subject) {
      return res.status(400).json({ error: 'Missing required fields: user_id, class_code, subject' });
    }

    const token = extractToken(req);
    const db = getSupabase(token);
    const { data, error } = await db
      .from('student_attendance')
      .upsert({
        user_id, campus_id,
        class_code, section: section || '', subject,
        session_type: session_type || 'LEC',
        present: present || 0, absent: absent || 0,
        pending: pending || 0, no_attendance: no_attendance || 0,
        required_percentage: required_percentage !== undefined && required_percentage !== null ? Number(required_percentage) : 75,
        last_updated: new Date().toISOString()
      }, { onConflict: 'user_id, subject, session_type, class_code' })
      .select();

    if (error) {
      console.error('Error saving attendance:', error);
      return res.status(500).json({ error: 'Failed to save attendance', details: error.message });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Save attendance error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * POST /api/attendance/update-criteria
 * Updates required_percentage across all subjects for a student.
 */
router.post('/update-criteria', async (req, res) => {
  try {
    const { user_id, required_percentage } = req.body;
    if (!user_id || required_percentage === undefined) {
      return res.status(400).json({ error: 'Missing user_id or required_percentage' });
    }

    const token = extractToken(req);
    const db = getSupabase(token);
    const { data, error } = await db
      .from('student_attendance')
      .update({ required_percentage: Number(required_percentage) })
      .eq('user_id', user_id)
      .select();

    if (error) {
      console.error('Error updating criteria:', error);
      return res.status(500).json({ error: 'Failed to update criteria', details: error.message });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Update criteria error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * POST /api/attendance/save-exception
 * Report a CANCELLED or EXTRA lecture for a specific subject on a specific date.
 */
router.post('/save-exception', async (req, res) => {
  try {
    const { user_id, campus_id, class_code, subject, session_type, exception_date, exception_type, note } = req.body;

    if (!user_id || !subject || !exception_date || !exception_type) {
      return res.status(400).json({ error: 'Missing required fields: user_id, subject, exception_date, exception_type' });
    }

    if (!['CANCELLED', 'EXTRA'].includes(exception_type)) {
      return res.status(400).json({ error: "exception_type must be 'CANCELLED' or 'EXTRA'" });
    }

    const db = getSupabase();
    const { data, error } = await db
      .from('attendance_exceptions')
      .upsert({
        user_id,
        campus_id,
        class_code,
        subject,
        session_type: session_type || 'LEC',
        exception_date,
        exception_type,
        note: note || null,
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id, subject, session_type, exception_date' })
      .select();

    if (error) {
      console.error('Error saving exception:', error);
      return res.status(500).json({ error: 'Failed to save exception', details: error.message });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Save exception error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * GET /api/attendance/exceptions?user_id=...
 * Fetch all exceptions logged by a student.
 */
router.get('/exceptions', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const token = extractToken(req);
    const db = getSupabase(token);
    const { data, error } = await db
      .from('attendance_exceptions')
      .select('*')
      .eq('user_id', user_id)
      .order('exception_date', { ascending: false });

    if (error) return res.status(500).json({ error: 'Failed to fetch exceptions', details: error.message });
    return res.json({ exceptions: data || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * DELETE /api/attendance/exception/:id
 * Remove an exception by its UUID.
 */
router.delete('/exception/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;
    if (!id || !user_id) {
      return res.status(400).json({ error: 'Missing id or user_id' });
    }

    const token = extractToken(req);
    const db = getSupabase(token);
    const { error } = await db
      .from('attendance_exceptions')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id); // RLS-safe: only delete own rows

    if (error) return res.status(500).json({ error: 'Failed to delete exception', details: error.message });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * GET /api/attendance/dashboard?user_id=...
 * Returns per-subject attendance with Phase 3+4 timeline projections and exception awareness.
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ error: 'Missing user_id' });
    }

    const token = extractToken(req);
    const db = getSupabase(token);

    // 1. Fetch user's attendance data
    const { data: attendanceData, error: attError } = await db
      .from('student_attendance')
      .select('*')
      .eq('user_id', user_id);

    if (attError) return res.status(500).json({ error: 'Failed to fetch attendance', details: attError.message });
    if (!attendanceData || attendanceData.length === 0) {
      return res.json({ overall_attendance: 0, subjects: [] });
    }

    const campusId = attendanceData[0]?.campus_id;
    const classCode = attendanceData[0]?.class_code;
    const section = attendanceData[0]?.section || '';

    // 2. Fetch academic calendar (global holidays + exams)
    let holidaySet = new Set();
    let semesterEnd = null;

    if (campusId) {
      const { data: calData } = await db
        .from('academic_calendar')
        .select('event_date, event_type, semester_end')
        .eq('campus_id', campusId);

      if (calData && calData.length > 0) {
        calData.forEach(ev => {
          if (['HOLIDAY', 'VACATION', 'EXAM'].includes(ev.event_type)) {
            holidaySet.add(ev.event_date);
          }
          if (ev.semester_end && !semesterEnd) {
            semesterEnd = new Date(ev.semester_end);
          }
        });
      }
    }

    if (!semesterEnd) semesterEnd = addDays(new Date(), 90);

    // 3. Fetch timetable slots
    let allTimetableSlots = [];
    if (classCode) {
      let ttQuery = db
        .from('timetable_slots')
        .select('subject, session_type, day, start_time, end_time, section')
        .eq('class_code', classCode);
      if (campusId) ttQuery = ttQuery.eq('campus_id', campusId);
      const { data: ttData } = await ttQuery;
      if (ttData) {
        allTimetableSlots = ttData.filter(s =>
          !section || s.section === section || s.section === '' || s.session_type === 'LEC'
        );
      }
    }

    // 4. Fetch user exceptions (CANCELLED / EXTRA)
    let userExceptions = [];
    const { data: exceptData } = await db
      .from('attendance_exceptions')
      .select('*')
      .eq('user_id', user_id);
    if (exceptData) userExceptions = exceptData;

    // 5. Per-subject projection (exception-aware)
    let totalPresent = 0;
    let totalAbsent = 0;

    const subjects = attendanceData.map(record => {
      const stats = calculateCurrent(record);
      const { requiredToAttend, safeBunks, status } = computeRequiredAndSafe(record);

      totalPresent += record.present || 0;
      totalAbsent += record.absent || 0;

      const subjectSlots = allTimetableSlots.filter(s =>
        s.subject === record.subject &&
        (s.session_type || 'LEC') === (record.session_type || 'LEC')
      );

      // Per-subject exception split
      const subjExcepts = userExceptions.filter(
        e => e.subject === record.subject &&
             (e.session_type || 'LEC') === (record.session_type || 'LEC')
      );

      // Build per-subject holiday set (global + CANCELLED exceptions)
      const subjectHolidaySet = new Set(holidaySet);
      const extraLectures = [];
      let cancelledCount = 0;
      let extraCount = 0;

      for (const ex of subjExcepts) {
        if (ex.exception_type === 'CANCELLED') {
          subjectHolidaySet.add(ex.exception_date);
          cancelledCount++;
        } else if (ex.exception_type === 'EXTRA') {
          const dt = new Date(ex.exception_date);
          extraLectures.push({
            dateStr: ex.exception_date,
            day: getDayAbbr(dt),
            formatted: formatDate(dt)
          });
          extraCount++;
        }
      }

      const futureLectures = projectFutureLectures(subjectSlots, subjectHolidaySet, semesterEnd, extraLectures);

      const recoveryLecture = findRecoveryDate(futureLectures, requiredToAttend);
      const recoveryDate = recoveryLecture
        ? { formatted: recoveryLecture.formatted, dateStr: recoveryLecture.dateStr }
        : null;
      const isUnrecoverable = requiredToAttend > 0 && futureLectures.length < requiredToAttend;

      const safeBunkDates = status !== 'DANGER'
        ? findSafeBunkDates(futureLectures, safeBunks).map(l => ({
            formatted: l.formatted,
            dateStr: l.dateStr,
            day: l.day
          }))
        : [];

      const nextLecture = futureLectures.length > 0
        ? {
            formatted: futureLectures[0].formatted,
            dateStr: futureLectures[0].dateStr,
            day: futureLectures[0].day,
            time: futureLectures[0].start_time,
            isExtra: futureLectures[0].isExtra
          }
        : null;

      return {
        ...record,
        stats,
        requiredToAttend,
        safeBunks,
        status,
        projection: {
          futureLectureCount: futureLectures.length,
          semesterEnd: toDateStr(semesterEnd),
          nextLecture,
          recoveryDate,
          isUnrecoverable,
          safeBunkDates,
          exceptionSummary: { cancelledCount, extraCount }
        }
      };
    });

    const overallPct = (totalPresent + totalAbsent) > 0
      ? (totalPresent / (totalPresent + totalAbsent)) * 100
      : 0;

    return res.json({ overall_attendance: overallPct, subjects });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * GET /api/attendance/calendar?campus_id=...
 */
router.get('/calendar', async (req, res) => {
  try {
    const { campus_id } = req.query;
    const db = getSupabase();
    let query = db.from('academic_calendar').select('*').order('event_date', { ascending: true });
    if (campus_id) query = query.eq('campus_id', campus_id);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: 'Failed to fetch calendar', details: error.message });
    return res.json({ calendar: data || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * GET /api/attendance/ai-advisor
 * Uses Gemini to generate a personalized attendance summary.
 */
router.post('/ai-advisor', async (req, res) => {
  try {
    const { dashboardData } = req.body;
    
    if (!dashboardData || !dashboardData.subjects) {
      return res.status(400).json({ error: 'Missing dashboard data' });
    }

    const aiClient = getAI();
    
    const subjectSummaries = dashboardData.subjects.map(s => {
      let line = `- ${s.subject}: ${s.stats?.current?.toFixed(1)}% (Target: ${s.required_percentage}%). `;
      if (s.status === 'DANGER') {
        line += `Needs ${s.requiredToAttend} more lectures. `;
        if (s.projection?.recoveryDate) {
          line += `Expected recovery: ${s.projection.recoveryDate.formatted}.`;
        } else if (s.projection?.isUnrecoverable) {
          line += `Unrecoverable this semester.`;
        }
      } else if (s.status === 'WARNING') {
        line += `Only ${s.safeBunks} safe bunks left.`;
      } else {
        line += `${s.safeBunks} safe bunks available.`;
      }
      return line;
    }).join('\n');

    const prompt = `
You are Cosen, an empathetic and highly intelligent academic advisor.
Analyze the following student attendance data and provide a short, punchy, and encouraging 2-3 paragraph summary.
Focus on the most urgent actions (DANGER subjects) and celebrate the wins (SAFE subjects).
Do NOT output markdown tables or complex formatting. Keep it conversational.
Use emojis sparingly.

Data:
Overall Attendance: ${dashboardData.overall_attendance?.toFixed(1)}%
Subjects:
${subjectSummaries}
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return res.json({ advice: response.text });
  } catch (err) {
    console.error('AI Advisor error:', err);
    return res.status(500).json({ error: 'Failed to generate advice', details: err.message });
  }
});

module.exports = { router, computeRequiredAndSafe };
