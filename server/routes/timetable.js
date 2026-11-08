const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Supabase client (lazy init)
let supabase;
function getSupabase() {
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return supabase;
}

/**
 * Convert "HH:MM" time string to minutes since midnight.
 */
function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

/**
 * Applies temporary orientation overrides for 16-18 July 2026.
 */
function applyOrientationOverrides(slots, addOrientationEvents = true) {
  const now = new Date();
  
  // Cutoff is July 19, 2026. Before this, any request for THU, FRI, SAT gets overridden.
  const cutoffDate = new Date(2026, 6, 19); 
  if (now >= cutoffDate) {
    return slots;
  }

  const transformedSlots = [];
  const orientationRooms = ['C006', 'C007', 'C011', 'C012', 'C013'];
  const overrideDays = ['THU', 'FRI', 'SAT'];

  const queriedDays = slots.length > 0 ? [...new Set(slots.map(s => s.day))] : [];

  // Add the all-day orientation events
  if (addOrientationEvents) {
    orientationRooms.forEach(room => {
      overrideDays.forEach(day => {
        if (queriedDays.includes(day)) {
          transformedSlots.push({
            room: room,
            building: 'C',
            day: day,
            start_time: '08:00',
            end_time: '16:15',
            subject: '1st Year Orientation',
            teacher: 'All Faculty',
            session_type: 'Event',
            program: 'B.Tech',
            year: '1',
            section: 'ALL',
            class_code: 'Orientation',
            is_override: true
          });
        }
      });
    });
  }

  // Map existing slots to new locations
  for (const slot of slots) {
    if (!overrideDays.includes(slot.day)) {
      transformedSlots.push(slot);
      continue;
    }

    const currentDay = slot.day;
    // Strip ALL spaces, uppercase, replace O with 0
    const normRoom = (slot.room || '').toUpperCase().replace(/O/g, '0').replace(/\s+/g, '');
    let movedToRoom = null;

    if (normRoom.includes('C006')) {
      movedToRoom = 'B006';
    } else if (normRoom.includes('C007')) {
      if (currentDay === 'THU') {
        movedToRoom = 'B012';
      } else if (currentDay === 'FRI') {
        const startMin = timeToMinutes(slot.start_time);
        if (startMin !== null && startMin < timeToMinutes('12:35')) {
          movedToRoom = 'BX201';
        } else {
          movedToRoom = 'B007';
        }
      } else if (currentDay === 'SAT') {
        movedToRoom = 'B007';
      }
    } else if (normRoom.includes('C012')) {
      if (currentDay === 'THU') {
        movedToRoom = 'B007';
      } else if (currentDay === 'FRI') {
        const startMin = timeToMinutes(slot.start_time);
        if (startMin !== null && startMin < timeToMinutes('09:50')) {
          movedToRoom = 'B007';
        } else {
          movedToRoom = 'B012';
        }
      }
    } else if (normRoom.includes('C013')) {
      if (currentDay === 'THU') {
        if (slot.start_time === '14:25') movedToRoom = 'C107';
        else movedToRoom = 'CX203';
      } else if (currentDay === 'FRI') {
        if (slot.start_time === '14:25') movedToRoom = 'BX201';
        else movedToRoom = 'CX203';
      }
    }

    if (movedToRoom) {
      const originalRoom = slot.room;
      transformedSlots.push({
        ...slot,
        room: movedToRoom,
        building: movedToRoom.match(/^([A-Z]+)/) ? movedToRoom.match(/^([A-Z]+)/)[1] : movedToRoom,
        subject: `${slot.subject} (Transformed from ${originalRoom})`,
        is_override: true
      });
    } else {
      transformedSlots.push(slot);
    }
  }

  return transformedSlots;
}

/**
 * GET /buildings
 * Fetch all unique building values from timetable_slots.
 * Uses .range() pagination to handle large datasets.
 */
router.get('/buildings', async (req, res) => {
  try {
    const { campus_id } = req.query;
    const db = getSupabase();
    const allBuildings = new Set();
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      let query = db.from('timetable_slots').select('building');
      if (campus_id) query = query.eq('campus_id', campus_id);
      
      const { data, error } = await query.range(from, from + pageSize - 1);

      if (error) {
        console.error('Error fetching buildings:', error);
        return res.status(500).json({ error: 'Failed to fetch buildings', details: error.message });
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      for (const row of data) {
        if (row.building) {
          allBuildings.add(row.building);
        }
      }

      if (data.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    }

    const buildings = Array.from(allBuildings).sort();

    return res.json({ buildings });
  } catch (err) {
    console.error('Buildings error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * GET /rooms?building=B&day=TUE&time=09:30
 * Query rooms for a given building and day, then compute status at the given time.
 */
router.get('/rooms', async (req, res) => {
  try {
    const { building, day, time, campus_id } = req.query;

    if (!building || !day || !time) {
      return res.status(400).json({
        error: 'Missing required query parameters: building, day, time',
      });
    }

    const queryMinutes = timeToMinutes(time);
    if (queryMinutes === null) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:MM.' });
    }

    const db = getSupabase();

    // Fetch all slots for the given building and day (with pagination)
    let allSlots = [];
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      let query = db
        .from('timetable_slots')
        .select('*');
        
      if (day && day !== 'ALL') {
        query = query.eq('day', day);
      }
      if (campus_id) {
        query = query.eq('campus_id', campus_id);
      }
      
      const { data, error } = await query.range(from, from + pageSize - 1);

      if (error) {
        console.error('Error fetching rooms:', error);
        return res.status(500).json({ error: 'Failed to fetch room data', details: error.message });
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      allSlots.push(...data);

      if (data.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    }

    // Apply Orientation Overrides
    allSlots = applyOrientationOverrides(allSlots, true);

    // Now filter by building in memory so moved classes appear correctly
    if (building && building !== 'ALL') {
      allSlots = allSlots.filter(s => s.building === building);
    }

    // Group slots by room
    const roomMap = {};
    for (const slot of allSlots) {
      const roomName = slot.room;
      if (!roomMap[roomName]) {
        roomMap[roomName] = [];
      }
      roomMap[roomName].push(slot);
    }

    // Calculate status for each room
    const rooms = [];
    let freeCount = 0;
    let busySoonCount = 0;
    let inUseCount = 0;
    let concludedCount = 0;

    for (const [roomName, slots] of Object.entries(roomMap)) {
      // Sort slots by start_time
      const sortedSlots = slots.sort((a, b) => {
        const aMin = timeToMinutes(a.start_time) || 0;
        const bMin = timeToMinutes(b.start_time) || 0;
        return aMin - bMin;
      });

      // Build full schedule
      const fullSchedule = sortedSlots.map((s) => ({
        subject: s.subject,
        teacher: s.teacher,
        start_time: s.start_time,
        end_time: s.end_time,
        session_type: s.session_type,
        program: s.program,
        year: s.year,
        section: s.section,
        class_code: s.class_code,
      }));

      // Determine status
      let status = 'free';
      let currentClass = null;
      let nextClass = null;

      for (const slot of sortedSlots) {
        const startMin = timeToMinutes(slot.start_time);
        const endMin = timeToMinutes(slot.end_time);

        if (startMin === null || endMin === null) continue;

        // Check if currently in use
        if (queryMinutes >= startMin && queryMinutes < endMin) {
          status = 'in-use';
          currentClass = {
            subject: slot.subject,
            teacher: slot.teacher,
            start_time: slot.start_time,
            end_time: slot.end_time,
            session_type: slot.session_type,
            program: slot.program,
            year: slot.year,
            section: slot.section,
            class_code: slot.class_code,
          };
        }

        // Find next upcoming class (starts after current time)
        if (startMin > queryMinutes && !nextClass) {
          nextClass = {
            subject: slot.subject,
            teacher: slot.teacher,
            start_time: slot.start_time,
            end_time: slot.end_time,
            session_type: slot.session_type,
            program: slot.program,
            year: slot.year,
            section: slot.section,
            class_code: slot.class_code,
          };
        }
      }

      // Check busy-soon: free now but next class starts within 15 minutes
      if (status === 'free' && nextClass) {
        const nextStart = timeToMinutes(nextClass.start_time);
        if (nextStart !== null && nextStart - queryMinutes <= 15 && nextStart - queryMinutes > 0) {
          status = 'busy-soon';
        }
      }

      // Check if after college hours (6:00 PM = 18:00 = 1080 minutes)
      const isAfterHours = queryMinutes >= 18 * 60;
      if (isAfterHours) {
        status = 'concluded';
        currentClass = null;
        nextClass = null;
      }

      // Update counters
      if (status === 'concluded') concludedCount++;
      else if (status === 'free') freeCount++;
      else if (status === 'busy-soon') busySoonCount++;
      else if (status === 'in-use') inUseCount++;

      // Determine if this room is used as a lab
      const isLab = sortedSlots.some(s => {
        const type = (s.session_type || '').toLowerCase();
        const subj = (s.subject || '').toLowerCase();
        return type === 'lab' || subj.includes('(lab)');
      });

      rooms.push({
        name: roomName,
        status,
        currentClass,
        nextClass,
        fullSchedule,
        isLab,
      });
    }

    // Sort rooms by name
    rooms.sort((a, b) => a.name.localeCompare(b.name));

    const isAfterHours = queryMinutes >= 18 * 60;

    return res.json({
      rooms,
      summary: {
        free: isAfterHours ? 0 : freeCount,
        busySoon: isAfterHours ? 0 : busySoonCount,
        inUse: isAfterHours ? 0 : inUseCount,
        concluded: isAfterHours ? rooms.length : 0,
        isAfterHours,
      },
    });
  } catch (err) {
    console.error('Rooms error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * GET /classes
 * Fetch all unique class codes and sections from timetable_slots.
 */
router.get('/classes', async (req, res) => {
  try {
    const { campus_id } = req.query;
    const db = getSupabase();
    const classMap = {}; // { class_code: Set(sections) }
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      let query = db.from('timetable_slots').select('class_code, section');
      if (campus_id) query = query.eq('campus_id', campus_id);
      
      const { data, error } = await query.range(from, from + pageSize - 1);

      if (error) {
        console.error('Error fetching classes:', error);
        return res.status(500).json({ error: 'Failed to fetch classes', details: error.message });
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      for (const row of data) {
        const cCode = (row.class_code || '').trim();
        const sec = (row.section || '').trim();
        
        if (cCode) {
          if (!classMap[cCode]) classMap[cCode] = new Set();
          if (sec) classMap[cCode].add(sec);
        }
      }

      if (data.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    }

    const classes = [];
    for (const [cCode, sections] of Object.entries(classMap)) {
      if (sections.size > 0) {
        for (const sec of sections) {
          classes.push(`${cCode} ${sec}`);
        }
      } else {
        classes.push(cCode);
      }
    }

    classes.sort();
    return res.json({ classes });
  } catch (err) {
    console.error('Classes error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * GET /classes/:classCode
 * Fetch the full timetable for a specific class code + section.
 */
router.get('/classes/:classCode', async (req, res) => {
  try {
    const { classCode } = req.params;
    const { campus_id } = req.query;

    if (!classCode) {
      return res.status(400).json({ error: 'Missing class code parameter' });
    }

    // Example classCode parameter: "MLAI3B A" or "CB3A"
    const parts = classCode.split(' ');
    const baseClassCode = parts[0];
    const section = parts.length > 1 ? parts.slice(1).join(' ') : '';

    const db = getSupabase();
    const allSlots = [];
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      let query = db
        .from('timetable_slots')
        .select('*')
        .eq('class_code', baseClassCode);
        
      if (campus_id) query = query.eq('campus_id', campus_id);
      
      query = query.range(from, from + pageSize - 1);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching class timetable:', error);
        return res.status(500).json({ error: 'Failed to fetch class timetable', details: error.message });
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      // Filter in memory for section logic:
      // If a section is requested (e.g. 'A'), we include slots where section is 'A' OR section is empty (common classes)
      for (const row of data) {
        const rowSec = (row.section || '').trim();
        if (!section) {
          // If no section requested, include all (or just empty if we want to be strict, but usually no section means it's a unified class)
          allSlots.push(row);
        } else {
          // If section requested, include matching section AND empty sections AND any Lecture slots
          if (rowSec === section || rowSec === '' || row.session_type === 'LEC') {
            allSlots.push(row);
          }
        }
      }

      if (data.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    }

    // Apply overrides without generating orientation events for unrelated queries
    let filteredSlots = applyOrientationOverrides(allSlots, false);

    // Sort slots by start_time
    const sortedSlots = filteredSlots.sort((a, b) => {
      const aMin = timeToMinutes(a.start_time) || 0;
      const bMin = timeToMinutes(b.start_time) || 0;
      return aMin - bMin;
    });

    return res.json({ classCode, schedule: sortedSlots });
  } catch (err) {
    console.error('Class timetable error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * GET /teachers
 * Fetch all unique teacher names from timetable_slots.
 */
router.get('/teachers', async (req, res) => {
  try {
    const { campus_id } = req.query;
    const db = getSupabase();
    const teacherSet = new Set();
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      let query = db.from('timetable_slots').select('teacher');
      if (campus_id) query = query.eq('campus_id', campus_id);
      
      const { data, error } = await query.range(from, from + pageSize - 1);

      if (error) {
        console.error('Error fetching teachers:', error);
        return res.status(500).json({ error: 'Failed to fetch teachers', details: error.message });
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      for (const row of data) {
        const teacherName = (row.teacher || '').trim();
        if (teacherName) {
          teacherSet.add(teacherName);
        }
      }

      if (data.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    }

    const teachers = Array.from(teacherSet).sort();
    return res.json({ teachers });
  } catch (err) {
    console.error('Teachers error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

/**
 * GET /teachers/:name/status
 * Get the real-time status and today's schedule for a specific teacher.
 * Query params: ?day=MON&time=10:30
 */
router.get('/teachers/:name/status', async (req, res) => {
  try {
    const { name } = req.params;
    const { day, time, campus_id } = req.query;

    if (!name || !day || !time) {
      return res.status(400).json({ error: 'Missing required parameters: name (in path), day, time (in query)' });
    }

    const queryMinutes = timeToMinutes(time);
    if (queryMinutes === null) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:MM.' });
    }

    const db = getSupabase();
    const allSlots = [];
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;

    // Fetch all slots for this teacher on this day
    while (hasMore) {
      let query = db
        .from('timetable_slots')
        .select('*')
        .ilike('teacher', name) // case-insensitive match
        .eq('day', day);
        
      if (campus_id) query = query.eq('campus_id', campus_id);
      
      const { data, error } = await query.range(from, from + pageSize - 1);

      if (error) {
        console.error('Error fetching teacher status:', error);
        return res.status(500).json({ error: 'Failed to fetch teacher status', details: error.message });
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      allSlots.push(...data);

      if (data.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    }

    // Apply overrides without generating orientation events for unrelated queries
    let filteredSlots = applyOrientationOverrides(allSlots, false);

    // Sort slots by start_time
    const sortedSlots = filteredSlots.sort((a, b) => {
      const aMin = timeToMinutes(a.start_time) || 0;
      const bMin = timeToMinutes(b.start_time) || 0;
      return aMin - bMin;
    });

    // Build the full schedule for today
    const todaySchedule = sortedSlots.map((s) => ({
      subject: s.subject,
      room: s.room,
      building: s.building,
      start_time: s.start_time,
      end_time: s.end_time,
      session_type: s.session_type,
      program: s.program,
      year: s.year,
      section: s.section,
      class_code: s.class_code,
    }));

    // Determine status
    let status = 'free';
    let currentClass = null;
    let nextClass = null;

    for (const slot of sortedSlots) {
      const startMin = timeToMinutes(slot.start_time);
      const endMin = timeToMinutes(slot.end_time);

      if (startMin === null || endMin === null) continue;

      // Check if currently in a lecture
      if (queryMinutes >= startMin && queryMinutes < endMin) {
        status = 'in-lecture';
        currentClass = {
          subject: slot.subject,
          room: slot.room,
          building: slot.building,
          start_time: slot.start_time,
          end_time: slot.end_time,
          session_type: slot.session_type,
          program: slot.program,
          year: slot.year,
          section: slot.section,
          class_code: slot.class_code,
        };
      }

      // Find next upcoming class
      if (startMin > queryMinutes && !nextClass) {
        nextClass = {
          subject: slot.subject,
          room: slot.room,
          building: slot.building,
          start_time: slot.start_time,
          end_time: slot.end_time,
          session_type: slot.session_type,
          program: slot.program,
          year: slot.year,
          section: slot.section,
          class_code: slot.class_code,
        };
      }
    }

    // Check busy-soon
    if (status === 'free' && nextClass) {
      const nextStart = timeToMinutes(nextClass.start_time);
      if (nextStart !== null && nextStart - queryMinutes <= 15 && nextStart - queryMinutes > 0) {
        status = 'busy-soon';
      }
    }

    const isAfterHours = queryMinutes >= 18 * 60;
    if (isAfterHours) {
      status = 'concluded';
      currentClass = null;
      nextClass = null;
    }

    return res.json({
      teacher: name,
      day,
      time,
      status,
      currentClass,
      nextClass,
      todaySchedule,
      isAfterHours,
    });
  } catch (err) {
    console.error('Teacher status error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

router.applyOrientationOverrides = applyOrientationOverrides;
module.exports = router;
