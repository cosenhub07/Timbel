# 📝 Timbel Tasks & Implementation Roadmap

> **Master Work Breakdown Structure & Task Board**  
> **Status**: In Active Sprint  
> **Tracking**: Phases 1–6 (Foundations → Mobile Parity → Multi-Campus Scale)  

---

## 🎯 Current Sprint Focus
- Complete React Native / Expo screen parity with the Web client.
- Fine-tune SendiYou Anonymous Group Chat edge cases (identity reveal consent, member kick moderation).
- Finalize Smart Attendance Planner offline caching and what-if simulation UX.

---

## Phase 1: Core Timetable & Admin Web (Completed ✅)
- [x] **Excel Master Parser**: Bulk import `.xlsx` timetables into Supabase with batch slot insertions (`xlsx`).
- [x] **Dynamic Vacancy Engine**: Real-time room vacancy calculation by building, day, and time-scrubber.
- [x] **Building & Room Filters**: Multi-building selector with instant badge counters (Free, Soon, Busy).
- [x] **Class Timetable View**: Department and semester weekly schedule viewer with split-lab support.
- [x] **Faculty Directory & Live Status**: Real-time teacher whereabouts engine with upcoming lecture countdowns.
- [x] **Admin Slot Management**: Search, Add Slot (with duplicate collision prevention), Edit, and Delete slots.
- [x] **Class Schedule Purge**: Administrative tool to clear outdated class codes in one click.
- [x] **AI Issue Reporting & Conflict Auto-Resolve**: Gemini analyzes student complaints and applies auto-delete for canceled slots.
- [x] **Web Push Notification Engine**: VAPID push subscriptions and admin broadcast panel.

---

## Phase 2: SendiYou Anonymous Campus Community (Completed ✅)
- [x] **Anonymous Feed**: Campus board with category tags (Study, Crush, Lost & Found, Chill).
- [x] **Animated Card Assets**: Integrated category-specific Lottie animations for each post.
- [x] **1-on-1 Anonymous Chat**: Real-time private chat channels powered by Supabase Realtime.
- [x] **Anonymous Group Chat System**: Multi-member rooms with randomized animal aliases (`group_members`).
- [x] **Identity Reveal Protocol**: Interactive toggle allowing users to unlock verified student profiles.
- [x] **Admin Moderation Tools**: Suspend users, delete posts, and audit chat transcripts for abusive behavior.

---

## Phase 3: Smart Attendance Planner & AI Advisor (Completed ✅)
- [x] **Database Schema**: Created `student_attendance`, `academic_calendar`, and `attendance_exceptions` tables with RLS.
- [x] **Multi-Source Fusion Engine**: Merges student ERP counts with scheduled timetable slots and holiday blackouts.
- [x] **Predictive Calculations**: Implemented algorithms for Safe Bunk Allowance, Lectures Needed for 75%, and Max Achievable %.
- [x] **Attendance Dashboard UI**: Interactive dashboard on Web (`AttendancePlannerPage.jsx`) with status cards and progress rings.
- [x] **What-If Simulation Engine**: Sliders enabling students to simulate future attendance outcomes.
- [x] **AI Bunk Advisor**: Gemini endpoint providing strategic attendance advice based on remaining schedule.

---

## Phase 4: Native Mobile App Parity (In Progress 🟡)
- [x] **Expo Project Setup**: React Native 0.88 + Expo 58 with NativeWind v4 and custom theme tokens.
- [x] **Navigation Setup**: `TabNavigator` and `MainNavigator` in React Navigation v7.
- [x] **FinderScreen Implementation**: Native classroom vacancy tracker with touch-friendly building selector.
- [x] **TeachersScreen Implementation**: Faculty locator with search and live availability status.
- [x] **ClassesScreen Implementation**: Weekly schedule cards with horizontal day tabs.
- [x] **AttendanceScreen Implementation**: Native attendance cards with bunk meters and exception logging.
- [x] **SendiYouScreen Implementation**: Feed cards with native Lottie animations and bottom-sheet filters.
- [x] **ChatScreen & MessagesScreen Implementation**: Native keyboard-avoiding realtime chat interface.
- [x] **ProfileScreen & LoginScreen**: Google Auth session handling with Async Storage persistence.
- [ ] **E2E Mobile Testing on Physical Devices**: Test on Android and iOS physical devices via Expo Go / Development Builds.
- [ ] **Native Push Notifications**: Integrate `expo-notifications` with Supabase push notification triggers.
- [ ] **Offline SQLite / MMKV Cache**: Cache timetable slots locally for zero-latency offline browsing.

---

## Phase 5: Multi-Campus Expansion (Upcoming 🔵)
- [x] **Multi-Campus Schema**: `campuses` table created with university email domain mapping (`001_campus_clustering.sql`).
- [ ] **Campus Switcher / Auto-Detection**: Automatically route users to their university based on email domain or picker modal.
- [ ] **Campus-Scoped Admin Roles**: Allow college coordinators to manage only their university's data.
- [ ] **Direct ERP Integration Hooks**: Web scrapers / API connectors for popular college ERP portals (e.g., CollPoll, TCS iON, Edusprint).

---

## Phase 6: Production Hardening, CI/CD & Launch (Upcoming 🔵)
- [ ] **Automated GitHub Actions CI/CD**: Run linting, unit tests, and build checks on pull requests.
- [ ] **Dockerization**: Containerize Express backend with production multi-stage Dockerfile.
- [ ] **EAS Production Builds**: Configure `eas.json` for Android Play Store (.aab) and Apple App Store (.ipa).
- [ ] **Rate Limiting & DDoS Protection**: Add `express-rate-limit` and Cloudflare edge caching for API endpoints.
- [ ] **Sentry Error Tracking**: Instrument both Web and Mobile apps with Sentry for real-time crash reporting.
