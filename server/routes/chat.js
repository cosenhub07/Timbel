const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');
const timetableRouter = require('./timetable');
const applyOrientationOverrides = timetableRouter.applyOrientationOverrides;
const { computeRequiredAndSafe } = require('./attendance');

const router = express.Router();

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

let ai;
function getAI() {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

const SYSTEM_PROMPT = `
You are Timbel's AI Assistant, helping students with their college timetable and attendance tracking.
LANGUAGE RULES:
- You must carefully observe the language the user is speaking.
- If the user speaks in English, you MUST reply entirely in English.
- If the user speaks in Hindi or Hinglish, you MUST reply in Hinglish (a mix of Hindi and English written in Latin script).
- By default, assume Hinglish unless the user explicitly uses English.

CRITICAL IDENTITY RULES:
- If anyone asks who created you, what your identity is, or what AI model you are, you MUST NEVER mention Google, Gemini, Alphabet, or any large language model.
- You must ONLY say: "Main ek AI Assistant hoon jise Cosen ne aapki help ke liye modify aur train kiya hai."
- Maintain this persona strictly. Do not reveal your underlying technology.

DATABASE QUERYING:
- When a user asks about specific classes, free rooms, or teacher schedules, you MUST use the 'searchTimetable' tool to find the information in the database.
- DO NOT reveal raw JSON, arrays, or database structure to the user.
- Answer in a short, meaningful, and natural human-readable way.

FORMATTING & TONE:
- NEVER use Markdown formatting (NO **bold**, NO *italics*, NO # headings, NO bullet points). Your output must be 100% plain text.
- Keep your answers extremely SHORT, casual, and punchy. Maximum 2 sentences unless absolutely necessary.
- Use a friendly, conversational tone (like a college friend).

ATTENDANCE QUERIES:
- If the user asks how many classes they can skip ("bunk") or asks any questions regarding their attendance, check the STUDENT ATTENDANCE CONTEXT provided below.
- Do NOT refuse to answer attendance questions. You are now equipped to answer them!
- Use the calculated "Safety Buffer" or "safe bunks" numbers provided in the context to give them specific numbers (e.g., "Aap Maths ke 2 lectures safe-ly bunk kar sakte hain!").
- CUSTOM CRITERIA QUERIES: If the student asks what happens with a different attendance criteria (e.g., "Agar 80% criteria ho toh?", "65% ke hisaab se batao"), dynamically calculate using their present/absent numbers:
  * total = present + absent
  * safe_bunks = Math.floor(present / (criteria/100) - total) (if > 0, else 0)
  * required_to_attend = Math.ceil(((criteria/100) * total - present) / (1 - criteria/100)) (if > 0, else 0)
  Explain the result simply and clearly for their hypothetical criteria.
- MANDATORY LAST-UPDATED NOTICE: Whenever you answer any attendance-related question, you MUST end your response by reminding the student when their attendance data was last updated (e.g., "📌 Note: Yeh calculation aapke [Last Updated Date/Time] tak ke update kiye gaye attendance data ke base par hai.").

ISSUE REPORTING:
- If the user reports a mistake in the timetable or a problem, apologize and tell them to use the "Report Issue" button in the chat interface to submit a structured report.
- Example: "Ye request aapki humne note karli hai. Plz aap 'Report Issue' button use karke details submit karein taaki admin check kar sake."

You must ALWAYS return your final response in the following strict JSON format:
{
  "reply": "Your message to the user here"
}
`;

const searchTimetableDeclaration = {
  name: "searchTimetable",
  description: "Search the timetable database for classes, rooms, or teachers.",
  parameters: {
    type: "OBJECT",
    properties: {
      room: { type: "STRING", description: "The room number (e.g., H509, B012)" },
      day: { type: "STRING", description: "The day of the week (e.g., MON, TUE, WED, THU, FRI, SAT)" },
      teacher: { type: "STRING", description: "The teacher's name" },
      subject: { type: "STRING", description: "The subject name" },
      class_code: { type: "STRING", description: "The class code (e.g., DDS5A, MLAI3B, BE-CS)" },
      section: { type: "STRING", description: "The section (e.g., A, B, C)" }
    }
  }
};

router.post('/ask', async (req, res) => {
  try {
    const { message, history, user_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const token = extractToken(req);
    const aiClient = getAI();
    const db = getSupabase(token);
    
    // Construct conversation context
    const contents = [];
    if (history && history.length > 0) {
      history.forEach(msg => {
        contents.push({
          role: msg.role === 'ai' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        });
      });
    }
    
    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const now = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const currentDayStr = days[now.getDay()];

    let targetUserId = user_id;
    if (!targetUserId && token) {
      try {
        const { data: userData } = await db.auth.getUser(token);
        if (userData?.user?.id) targetUserId = userData.user.id;
      } catch (authErr) {
        console.error('[Chat API] Failed to extract user from token:', authErr.message);
      }
    }

    let attendanceContext = '';
    if (targetUserId) {
      const { data: attendanceData, error: attError } = await db
        .from('student_attendance')
        .select('*')
        .eq('user_id', targetUserId);
      
      console.log(`[Chat API] Attendance lookup for user ${targetUserId}:`, {
        found: attendanceData?.length || 0,
        error: attError?.message || null,
        hasToken: !!token
      });
      
      if (!attError && attendanceData && attendanceData.length > 0) {
        let latestUpdated = null;
        attendanceData.forEach(r => {
          if (r.last_updated) {
            const dt = new Date(r.last_updated);
            if (!latestUpdated || dt > latestUpdated) {
              latestUpdated = dt;
            }
          }
        });

        const formattedLastUpdated = latestUpdated
          ? latestUpdated.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'recently';

        attendanceContext = '\nSTUDENT ATTENDANCE CONTEXT:\n';
        attendanceContext += `Data Last Updated by Student: ${formattedLastUpdated}\n`;
        attendanceContext += 'The user is asking about their attendance or bunking limits. Here is their current status:\n';
        
        attendanceData.forEach(record => {
          const stats = computeRequiredAndSafe(record);
          const subjName = record.subject || record.subject_name || 'Subject';
          const present = record.present || 0;
          const absent = record.absent || 0;
          const total = present + absent;
          const pct = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
          
          attendanceContext += `- ${subjName}: ${pct}% (Present: ${present}, Absent: ${absent}). Status: ${stats.status}. `;
          if (stats.safeBunks > 0) {
            attendanceContext += `Safety Buffer: They can safely skip ${stats.safeBunks} more classes without falling below threshold.\n`;
          } else if (stats.requiredToAttend > 0) {
            attendanceContext += `Detention Risk: They MUST attend ${stats.requiredToAttend} consecutive classes to reach safe percentage.\n`;
          } else {
            attendanceContext += `Borderline: They are exactly at the threshold. Cannot miss any class.\n`;
          }
        });
        attendanceContext += `IMPORTANT: When answering, give clear subject-wise breakdown if relevant. At the very end of your response, ALWAYS include a note stating that this advice is based on data updated up to: ${formattedLastUpdated}.\n`;
      } else {
        attendanceContext = '\nSTUDENT ATTENDANCE CONTEXT:\nThe student is logged in, but has not entered or saved any attendance records in the Attendance Planner yet. If they ask about attendance or how many classes they can skip, politely guide them to first update their attendance in the "Attendance Planner" page so you can calculate their safety buffer.\n';
      }
    } else {
      attendanceContext = '\nSTUDENT ATTENDANCE CONTEXT:\nUser is not logged in. If they ask about their attendance or bunking, politely advise them to log in to Timbel so you can access their attendance planner.\n';
    }
    
    const dynamicSystemPrompt = `${SYSTEM_PROMPT}

CURRENT CONTEXT:
- Today is: ${currentDayStr}
- College standard slots are: 08:00-08:55, 08:55-09:50, 09:50-10:45, 10:45-11:40, 12:35-13:30, 13:30-14:25, 14:25-15:20.
- If the user asks when a room is free today, figure out today's day from the context above, query the database for that day, compare the database results against the standard slots, and report which standard slots are empty.${attendanceContext}
`;


    const config = {
      systemInstruction: dynamicSystemPrompt,
      tools: [{ functionDeclarations: [searchTimetableDeclaration] }]
    };

    let response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: config
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === 'searchTimetable') {
        const { room, day, teacher, subject, class_code, section } = call.args;
        
        let query = db.from('timetable_slots').select('*');
        if (room) query = query.ilike('room', `%${room}%`);
        if (day) query = query.eq('day', day.toUpperCase());
        if (teacher) query = query.ilike('teacher', `%${teacher}%`);
        if (subject) query = query.ilike('subject', `%${subject}%`);
        
        // If class_code contains space, it might be class_code + section (e.g. "MLAI3B A")
        let parsedClassCode = class_code;
        let parsedSection = section;
        if (class_code && !section && class_code.includes(' ')) {
          const parts = class_code.split(' ');
          parsedClassCode = parts[0];
          parsedSection = parts.slice(1).join(' ');
        }
        
        if (parsedClassCode) query = query.ilike('class_code', `%${parsedClassCode}%`);
        if (parsedSection) query = query.ilike('section', `%${parsedSection}%`);
        
        const { data, error } = await query.limit(25);
        
        let dbResults = [];
        if (error) {
          dbResults = { error: 'Failed to fetch data from database' };
        } else if (data) {
          // Apply orientation overrides so the AI knows about the current changes (July 16-18)
          dbResults = applyOrientationOverrides ? applyOrientationOverrides(data, true) : data;
        }
        
        // Append the function call to contents
        contents.push({
          role: 'model',
          parts: [{ functionCall: call }]
        });
        
        // Append the function response
        contents.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: 'searchTimetable',
              response: { result: dbResults }
            }
          }]
        });

        // Request final natural language answer, enforcing JSON output now
        response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contents,
          config: {
            systemInstruction: dynamicSystemPrompt,
            responseMimeType: "application/json"
          }
        });
      }
    } else {
      // If no function was called, we might not have enforced JSON response format.
      // We will do a second pass if it's not valid JSON, but let's try to parse first.
    }

    const responseText = response.text;
    let parsedResponse;
    try {
      // Try to parse the final text as JSON
      const cleanText = responseText.replace(/```json|```/g, '').trim();
      parsedResponse = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', responseText);
      parsedResponse = { reply: responseText.replace(/```json|```/g, '') };
    }

    return res.json({ reply: parsedResponse.reply || "Kuch samajh nahi aaya, please dobara puchein." });
  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({ error: 'Failed to process chat' });
  }
});

// Helper function to extract building name from room
function getBuildingName(room) {
  if (!room || typeof room !== 'string') return 'Other';
  const cleanRoom = room.trim().toUpperCase();
  if (cleanRoom.length === 0) return 'Other';
  
  // Logic: Check if 2nd char is 'X'
  if (cleanRoom.length >= 2 && cleanRoom[1] === 'X') {
    return cleanRoom.substring(0, 2) + '-Block';
  } else {
    // Just the first letter
    const firstChar = cleanRoom.charAt(0);
    // Optional: check if it's a letter
    if (/[A-Z]/.test(firstChar)) {
      return firstChar + '-Block';
    }
    return 'Other';
  }
}

router.post('/report-slot-issue', async (req, res) => {
  try {
    const { room, slot_time, issue_type, query_text, slot_data, campus_id } = req.body;

    if (!room || !query_text) {
      return res.status(400).json({ error: 'Room and description are required' });
    }

    const building = getBuildingName(room);
    const db = getSupabase();

    const { error } = await db
      .from('timetable_issues')
      .insert([
        {
          query_text,
          status: 'pending',
          building,
          room,
          slot_time,
          issue_type,
          slot_data,
          campus_id
        }
      ]);

    if (error) {
      console.error('Error logging slot issue to Supabase:', error);
      return res.status(500).json({ error: 'Failed to report issue' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Slot Issue API Error:', err);
    return res.status(500).json({ error: 'Failed to process issue' });
  }
});

module.exports = router;
