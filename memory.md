# Timbel (Timetable Detector & Campus Super-App) - Work Memory & Knowledge Base

> **Maintained By**: Cosen Engineering Team  
> **Repository**: `timbel`  
> **Last Updated**: November 2026  

---

## 1. Project Overview & Evolution

**Timbel** (developed by **Cosen**) began as an intelligent timetable detector and vacant classroom finder for engineering colleges. It has grown into a multi-campus university operations and student community platform comprising:
1. **Real-time Vacancy & Schedule Engine**: Instant classroom finder, teacher locator, and section timetable viewer.
2. **Smart Attendance Planner & Bunker**: Multi-source attendance prediction system reconciling ERP numbers with future timetable schedules and academic calendars.
3. **SendiYou**: Anonymous campus social community with Lottie animations, 1-on-1 private messaging, and anonymous group chats with randomized animal aliases.
4. **Google Gemini AI Assistant**: Natural language campus assistant operating with structured function calling to query live database slots.
5. **Admin Automation Suite**: Excel master timetable importer, AI-assisted conflict resolver, slot CRUD, and push notification broadcasting.
6. **Cross-Platform Delivery**: React 19 Web client with PWA support + React Native (Expo 58) native mobile client.

---

## 2. Comprehensive Milestone History

### Milestone 1: Core Timetable & Dynamic Finder
- **Excel Spreadsheet Parser**: Built backend utility (`utils/excelParser.js`) using `xlsx` to parse complex master timetable sheets and insert batch records into Supabase `timetable_slots`.
- **Dynamic Vacancy Algorithm**: Formulated minutes-from-midnight calculation (`routes/timetable.js`) to evaluate occupancy states: `FREE` (vacant), `SOON` (class starts in $\le 15$ min), and `BUSY` (occupied).
- **Split-Slot & Laboratory Logic**: Handled complex simultaneous batch subdivisions (e.g., Batch A in Database Lab, Batch B in Networks Lab).
- **Teacher Status Tracker**: Real-time faculty directory showing current lecture location, upcoming class countdown, and daily itinerary.

### Milestone 2: Animated UI & Admin Panel Automation
- **Lottie Asset Overhaul**: Replaced standard CSS spinners and Lucide loaders with animated `loder.json` and integrated `assistent.json` for the AI assistant widget.
- **Universal Slot Management**: Added full CRUD operations for individual slots in `AdminPage.jsx` with strict duplicate-slot prevention.
- **AI Issue Analysis & Conflict Resolution**: Linked student issue reports to an automated Gemini analysis pipeline. If marked "Slot Canceled" or "Slot Empty," the admin can apply changes with a single click, instantly freeing the room in the database.
- **Clear Past Resolved Data**: Secure administrative action to prune resolved query logs and maintain a clean dashboard.

### Milestone 3: SendiYou Anonymous Social Network & Group Chats
- **Anonymous Feed**: Campus board allowing students to post requests, study groups, confessions, and lost-and-found notices without identity exposure.
- **Lottie Post Animations**: Users select specific animations (`sendiyu_lottie/`) representing the emotion/category of each post.
- **1-on-1 Realtime Chat**: Direct private messaging channels using Supabase Realtime for instant communication.
- **Anonymous Group Chat System (`group_chat_migration.sql`)**:
  - Multi-user chat rooms connected to posts.
  - Automatic assignment of unique animal aliases (`group_members.alias`, e.g. *StealthTiger*, *NeonFalcon*).
  - Admin/creator kick member controls.
  - Participant caps (`max_group_size`).
- **Mutual Identity Reveal Protocol**: Consent-based identity reveal system allowing users to unlock verified student profiles.
- **Moderation Tools**: Built admin tab (`SendiyouAdminTab.jsx`) with user suspension toggles, post deletion, and transcript auditing.

### Milestone 4: Multi-Campus Clustering (`001_campus_clustering.sql`)
- Created `campuses` table pre-seeded with 20+ universities (Parul University, PPSU, Gujarat University, VNSGU, GTU, SVNIT, PDEU, etc.).
- Assigned `campus_id UUID` foreign keys to `users`, `timetable_slots`, `timetable_meta`, `timetable_issues`, `sendiyou_posts`, and `push_subscriptions`.
- Auto-mapped users to university institutions based on email domain matching.

### Milestone 5: Smart Attendance Planner (`003_attendance_planner.sql`)
- **Database Tables**: Introduced `student_attendance`, `academic_calendar`, and `attendance_exceptions` with Row-Level Security.
- **Four-Status Model**: Defined `Present`, `Absent`, `Pending`, and `No Attendance`.
- **Multi-Source Fusion Engine**:
  - Reconciles student ERP attendance with weekly timetable frequency.
  - Filters out public holidays, semester breaks, and exam periods using `academic_calendar`.
- **Prediction Metrics**: Computes **Safe Bunk Allowance**, **Lectures Needed for 75%**, and **Max Attainable %**.
- **Interactive UI**: Shipped `AttendancePlannerPage.jsx` with progress meters, what-if sliders, and an AI Bunk Advisor powered by Gemini.

### Milestone 6: Native Mobile App Architecture (`/mobile`)
- Initialized React Native 0.88 + Expo 58 app with NativeWind v4 and React Navigation 7.
- Developed native mobile screens with complete feature parity:
  - `FinderScreen.js`: Classroom vacancy finder with building selector chips.
  - `TeachersScreen.js`: Faculty whereabouts locator.
  - `ClassesScreen.js`: Weekly section timetable cards.
  - `AttendanceScreen.js`: Native attendance tracker and bunk calculator.
  - `SendiYouScreen.js` & `CreatePostScreen.js`: Anonymous social feed with native Lottie animations.
  - `ChatScreen.js` & `MessagesScreen.js`: Realtime messaging interface with keyboard handling.
  - `ProfileScreen.js` & `LoginScreen.js`: User settings and Google OAuth session storage.

---

## 3. Technology Stack Reference

| Layer | Technologies Used |
|-------|-------------------|
| **Web Frontend** | React 19, Vite 8, Tailwind CSS v4, Three.js (`@react-three/fiber`, `@react-three/drei`), Lucide React, Lottie React, PWA |
| **Mobile Frontend** | React Native 0.88, Expo 58, NativeWind v4, React Navigation 7, Reanimated 4, Bottom Sheet |
| **Backend API** | Node.js, Express.js 5, Multer (file upload), Web-Push (VAPID), `@google/genai` (Gemini SDK) |
| **Database & Auth** | Supabase (PostgreSQL 15+, Row-Level Security, Realtime WebSockets, GoTrue Auth, Storage) |
| **Styling & Theme** | Dark Cosmic Glassmorphism (`#060C20` base, `#635BFF` primary, `#10B981` free, `#F59E0B` soon, `#EF4444` busy) |

---

## 4. Key Challenges Overcome & Lessons Learned

1. **Lottie-React ESM/CJS Interop Crash**:
   - *Problem*: Vite ESM crashed on `lottie-react` with `Element type is invalid: expected a string... but got: object`.
   - *Solution*: Added defensive interop fallback: `const Lottie = LottieLib.default || LottieLib;`.
2. **React-Markdown Dependency Conflicts**:
   - *Problem*: Peer dependency conflicts between React 19 and markdown packages.
   - *Solution*: Used `--legacy-peer-deps` and verified clean bundling in Vite.
3. **Mobile Hover State Discrepancy**:
   - *Problem*: Admin Edit/Delete buttons on slot cards were hidden behind hover states, rendering them inaccessible on mobile devices.
   - *Solution*: Redesigned slot cards with a responsive `flex-col` layout and placed action buttons permanently in the footer on mobile viewports.
4. **Multi-Campus Segregation**:
   - *Problem*: As the database scaled to multiple colleges, room numbers collided across different universities.
   - *Solution*: Enforced mandatory `campus_id` foreign keys and indexed queries across all timetable and user tables.
5. **Realtime Group Member Aliases**:
   - *Problem*: Ensuring two users joining an anonymous group chat at the exact same moment don't receive identical aliases.
   - *Solution*: Enforced a database unique constraint `UNIQUE (chat_id, alias)` backed by randomized animal generation with retry logic.

---

## 5. Master Documentation Index

- [architecture.md](file:///c:/Users/HP/OneDrive/Desktop/Projects/timbel/architecture.md): Complete system architecture, component breakdown, database schemas, and data flow diagrams.
- [prd.md](file:///c:/Users/HP/OneDrive/Desktop/Projects/timbel/prd.md): Product requirements document detailing functional specifications (FR-1 to FR-7), user personas, and KPIs.
- [rules.md](file:///c:/Users/HP/OneDrive/Desktop/Projects/timbel/rules.md): Engineering rules, code conventions, security constraints, and database guidelines.
- [tasks.md](file:///c:/Users/HP/OneDrive/Desktop/Projects/timbel/tasks.md): Sprint task roadmap, work breakdown structure, and milestone statuses.
- [DESIGN.md](file:///c:/Users/HP/OneDrive/Desktop/Projects/timbel/DESIGN.md): Timbel & Cosen Design System (Dark Cosmic Glassmorphism, colors, typography, and components).
- [smart_attendance_planner_report.md](file:///c:/Users/HP/OneDrive/Desktop/Projects/timbel/smart_attendance_planner_report.md): In-depth research and mathematical formulation of the attendance fusion engine.
- [native_app_conversion_roadmap.md](file:///c:/Users/HP/OneDrive/Desktop/Projects/timbel/native_app_conversion_roadmap.md): Web to React Native architectural transition blueprint.