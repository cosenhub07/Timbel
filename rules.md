# 📏 Timbel Engineering Rules & Code Standards

> **Guidelines, Coding Standards, and Architectural Invariants**  
> **Applies to**: Full Repository (`/client`, `/mobile`, `/server`, Database Migrations)  
> **Enforcement**: Strict across all pull requests and AI assistant modifications.

---

## 1. General Principles

1. **Maintain Documentation Integrity**: Always preserve existing comments, types, and logic unless explicitly requested to refactor.
2. **Never Break Multi-Campus Isolation**: Every query reading or mutating campus-scoped entities (`users`, `timetable_slots`, `timetable_issues`, `sendiyou_posts`, `student_attendance`) must include `campus_id` filtering.
3. **Strict Anonymity Invariant**: In SendiYou feeds and chats, user identities (names, emails, enrollment numbers) must never be transmitted to the frontend unless `is_revealed = true` or `revealed_ids` contains both participant IDs.
4. **Resilient Error Handling**: Never allow a component or route to crash into an unhandled blank screen. Always use Error Boundaries and fallback states.

---

## 2. Frontend Web Guidelines (`/client`)

### 2.1 React 19 & State Management
- Use modern function components with standard React 19 hooks (`useState`, `useEffect`, `useMemo`, `useCallback`).
- When importing CommonJS packages (such as `lottie-react`), always use interop defense:
  ```javascript
  import LottieLib from 'lottie-react';
  const Lottie = LottieLib.default || LottieLib;
  ```
- Keep context providers focused (`AuthContext`, `NotificationContext`). Do not dump unrelated state into global contexts.

### 2.2 Styling with Tailwind CSS v4
- Use semantic color tokens defined in `client/src/index.css`:
  - Background: `bg-[#060C20]` (`--color-slate-darker`)
  - Elevated Cards: `bg-[#1E293B]` (`--color-slate-card`) or `.glass-card`
  - Border: `border-[#334155]` (`--color-slate-border`)
  - Primary Action: `bg-[#635BFF]` (`--color-violet-primary`) with hover `bg-[#7C75FF]`
  - Semantic Status:
    - Free: `text-emerald-400` / `bg-emerald-500/10` (`--color-emerald-free`)
    - Soon: `text-amber-400` / `bg-amber-500/10` (`--color-amber-soon`)
    - Busy: `text-rose-400` / `bg-rose-500/10` (`--color-red-busy`)
- Never use harsh square buttons for primary CTAs — maintain pill radius (`rounded-full` or `rounded-xl` for cards).
- Animations: Replace default spinning wheels with the standard animated `loder.json` via Lottie.

### 2.3 Mobile-First Web Responsiveness
- All timetable cards, selectors, and modals must look and behave seamlessly on mobile browsers ($< 480\text{px}$).
- Do not rely solely on CSS `:hover` states for critical buttons (e.g., admin action buttons on slot cards must be permanently accessible on touch viewports).

---

## 3. Mobile Native Guidelines (`/mobile`)

### 3.1 React Native & Expo 58 Standards
- Use **Expo SDK 58** conventions with clean modular imports from `expo-*` libraries.
- Always wrap screen roots in `SafeAreaView` from `react-native-safe-area-context` to prevent notch/island clipping.
- Use `NativeWind v4` classes for layout, paired with design tokens from `src/theme/index.js`.
- For gesture handling, always use `react-native-gesture-handler` and `react-native-reanimated` v4.

### 3.2 Mobile Navigation (React Navigation 7)
- Use `TabNavigator` for top-level app destinations (Finder, Classes, Attendance, SendiYou, Profile).
- Stack modals and deep chat views inside `MainNavigator.js`.
- Always configure screen options with explicit header configurations and background colors (`#060C20`) to eliminate white transition flashes.

---

## 4. Backend Server Guidelines (`/server`)

### 4.1 Express 5.x Route Structure
- Group endpoints logically inside `routes/`:
  - `timetable.js`: Public schedule and vacancy search.
  - `attendance.js`: Personal attendance calculations and prediction engine.
  - `sendiyou.js`: Campus board and chat management.
  - `admin.js`: Protected administrative actions.
  - `chat.js`: AI chatbot and Gemini integration.
- Always validate incoming payloads (`req.body`, `req.query`, `req.params`) before querying Supabase.
- Always use the structured HTTP status codes:
  - `200 OK`: Successful read or update.
  - `201 Created`: Resource created.
  - `400 Bad Request`: Missing parameters or malformed data.
  - `401 Unauthorized`: Missing or invalid token.
  - `403 Forbidden`: Insufficient role or campus mismatch.
  - `404 Not Found`: Target entity not found.
  - `500 Internal Server Error`: Unhandled backend exception.

### 4.2 Admin Authentication Guard
- All administrative mutations must pass through `middleware/auth.js`:
  ```javascript
  const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    // Verify token with Supabase or JWT secret
    next();
  };
  ```

---

## 5. Supabase & Database Guidelines

### 5.1 Migration & SQL Rules
- All schema alterations must be scripted as repeatable SQL files inside `/server/migrations/` using timestamp or numbered prefixes (e.g., `005_feature_name.sql`).
- Always write defensive DDL:
  - `CREATE TABLE IF NOT EXISTS ...`
  - `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`
  - `CREATE INDEX IF NOT EXISTS ...`
- Table and column names must follow lowercase `snake_case` naming conventions.
- All foreign keys must specify behavior on parent delete (`ON DELETE CASCADE` or `ON DELETE SET NULL`).

### 5.2 Row Level Security (RLS)
- Every table containing student data MUST have RLS enabled:
  ```sql
  ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can manage own attendance"
    ON student_attendance FOR ALL
    USING (auth.uid() = user_id);
  ```
- Public tables (like `timetable_slots` and `campuses`) can have public read access, but writes must be locked down to admin users or service role keys.

### 5.3 Realtime Channel Hygiene
- Only subscribe to channels relevant to the active screen.
- Always unsubscribe and remove channels in `useEffect` cleanup handlers:
  ```javascript
  useEffect(() => {
    const channel = supabase.channel(`chat:${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, handleNewMessage)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);
  ```

---

## 6. AI & Google Gemini Integration Rules

1. **Brand Identity**: The assistant must always identify as "Modified and trained by Cosen for campus assistance" — never reveal base manufacturer identity.
2. **Language Adaptability**: Default to conversational **Hinglish** for campus familiarity, but automatically adapt to standard English if the user writes in English.
3. **No Raw Dumps**: Never expose raw SQL errors, JSON structures, or database column names to the student in chat responses.
4. **Structured Function Calling**: When fetching live timetable data, use Gemini Function Calling (`searchTimetable`) with typed parameter schemas.

---

## 7. Performance & Security Best Practices

1. **Pagination on Large Queries**: Never perform an unbounded `SELECT *` on `timetable_slots`. Always paginate using `.range(from, to)` or filter by building/day.
2. **Never Commit Secrets**: Secrets (`SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, `VAPID_PRIVATE_KEY`) belong strictly in `.env` and must never be committed to git.
3. **Rate Limiting**: Protect anonymous post creation and AI chat queries from spam through client throttling and backend rate checks.
