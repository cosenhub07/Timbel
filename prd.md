# 📋 Timbel Product Requirements Document (PRD)

> **Product Name**: Timbel (Timetable Detector & Campus Super-App)  
> **Author**: Cosen Product & Engineering Team  
> **Status**: Approved & In Active Production  
> **Target Audience**: College Students, Faculty Members, Department Heads, Campus Administrators  

---

## 1. Product Overview & Vision

### 1.1 Vision Statement
To become the unified operating system for university life — transforming chaotic campus schedules, vacant classroom hunting, attendance anxiety, and campus social barriers into an effortless, intelligent, and delight-driven digital experience.

### 1.2 Core Problem Statements
1. **The Ghost Room Problem**: Students seeking empty classrooms for group studies, club meetings, or project work wander corridors aimlessly because static PDF timetables are unsearchable and out of date.
2. **Attendance Anxiety & Academic Penalties**: Indian universities enforce strict 75% attendance criteria. Students track attendance on spreadsheets without knowing how many upcoming classes exist, when holidays fall, or how many lectures they can safely bunk without being debarred from exams.
3. **Faculty Availability Uncertainty**: Students waste hours searching for professors across departments without knowing if they are currently teaching a lab, in a lecture, or free.
4. **Campus Social Friction & Loneliness**: College students lack a secure, judgment-free space to ask for academic help, find study partners, find lost items, or share confessions anonymously without revealing their identities up front.
5. **Administrative Overhead**: Campus admins receive hundreds of timetable conflict complaints and must manually edit complex schedules or process changes with clunky tools.

---

## 2. User Personas

| Persona | Role | Primary Needs | Pain Points |
|---------|------|---------------|-------------|
| **Aarav (2nd Year B.Tech)** | Engineering Student | Find an empty lab/room during a 2-hour break; calculate if he can skip Friday's lectures without dropping below 75%. | Trapped using messy paper timetable PDFs; ERP attendance has no future forecasts. |
| **Dr. Mehta (Associate Professor)** | Faculty Member | Ensure students know when he is available; avoid constant room-availability queries. | Disturbed by students knocking on doors during live lectures; schedule changes hard to broadcast. |
| **Priya (1st Year Student)** | Fresher / New Joiner | Find a study buddy for calculus; ask campus questions without feeling judged. | Shy to ask public groups; fear of trolling or identity exposure. |
| **Prof. Sharma (Admin / Timetable Incharge)** | Timetable Coordinator | Upload Excel master schedules; resolve slot conflicts; broadcast cancellations. | Manual room allocations create double-booking errors; takes hours to reconcile student queries. |

---

## 3. Functional Requirements

### FR-1: Real-time Classroom & Vacancy Finder
- **FR-1.1 Building Selection**: User selects campus building (e.g., A, B, BX, C, CX, H).
- **FR-1.2 Day & Time Selector**: Defaults to current day and current time. Supports custom day picker (`MON`-`SAT`) and granular 5-minute time slider.
- **FR-1.3 Real-time Status Classification**:
  - `FREE` (Emerald): Room has no lecture for the current time slot. Displays duration until next class (e.g., "Free for next 1h 45m").
  - `SOON` (Amber): Room is currently free, but a scheduled lecture starts within $\le 15$ minutes.
  - `BUSY` (Crimson): Room is currently occupied. Displays subject title, faculty name, class code, and session end time.
- **FR-1.4 Room Schedule Modal**: Clicking any room opens a full breakdown of the day's timetable for that room.
- **FR-1.5 Building Level Aggregates**: Displays summary badges (e.g., "14 Free • 6 Busy • 2 Soon").

### FR-2: Class Timetable Explorer
- **FR-2.1 Class Code Selector**: Dropdown/searchable list of all departmental classes (e.g., `CV5`, `ME5`, `IT5A`, `IT5B`, `CSE-DS`, `AIML`).
- **FR-2.2 Weekly Schedule Grid**: Displays complete Monday to Saturday schedule cards organized by time slot.
- **FR-2.3 Split-Laboratory Support**: Correctly renders parallel sub-batches (e.g., Batch 1 in Database Lab, Batch 2 in Network Lab) occurring in identical time slots.
- **FR-2.4 Session Badges**: Differentiates `Lecture`, `Lab`, `Tutorial`, and `Event` visually.

### FR-3: Faculty Status & Directory
- **FR-3.1 Teacher Search**: Search faculty by name or department.
- **FR-3.2 Real-time Whereabouts**:
  - If teaching: Shows current room, subject, and time remaining.
  - If free: Displays "Currently Free" with time until their next class.
- **FR-3.3 Daily Faculty Schedule**: Accordion view displaying all scheduled classes for that faculty member on that day.

### FR-4: Smart Attendance Planner & Prediction Bunker
- **FR-4.1 Four-Status Ledger**:
  - `Present`: Attended lecture ($+1$ numerator, $+1$ denominator).
  - `Absent`: Missed lecture ($0$ numerator, $+1$ denominator).
  - `Pending`: Lecture conducted but teacher has not updated ERP (excluded from calculation or shown in best/worst case scenario).
  - `No Attendance`: Cancelled or administrative slot where attendance is exempt.
- **FR-4.2 Multi-Source Fusion Engine**:
  - Pulls current ERP numbers ($P, A$).
  - Queries `timetable_slots` to calculate remaining lectures per subject up to the semester end date.
  - Reconciles with `academic_calendar` to subtract institutional holidays, exams, and vacations.
- **FR-4.3 Predictive Action Metrics**:
  - **Safe Bunk Allowance**: Max lectures user can skip while maintaining $\ge 75\%$.
  - **Recovery Target**: Number of consecutive lectures user must attend if currently $< 75\%$.
  - **Max Attainable %**: Theoretical maximum if 100% of future lectures are attended.
- **FR-4.4 What-If Simulator**: Interactive sliders allow students to test hypothetical attendance scenarios.
- **FR-4.5 AI Attendance Advisor**: Gemini-powered conversational guidance providing tailored advice on exam eligibility.

### FR-5: SendiYou — Anonymous Campus Network
- **FR-5.1 Anonymous Feed**: Students post campus queries, study group invites, or lost-and-found requests without public identity.
- **FR-5.2 Categorization & Animations**: Tagged with categories (`Study`, `Crush`, `Lost & Found`, `Campus Life`, `Chill`) accompanied by animated Lottie illustrations.
- **FR-5.3 1-on-1 Anonymous Chat**: Direct private messaging where both parties communicate anonymously.
- **FR-5.4 Anonymous Group Chats**:
  - Multi-user rooms created for specific topics or post threads.
  - Automatic alias assignment (e.g., *CosmicFalcon*, *StealthTiger*).
  - Participant caps (`max_group_size`).
- **FR-5.5 Mutual Identity Reveal Protocol**: Users can selectively choose to reveal their verified student identity. Profile unlocks only when reciprocal consent or action occurs.
- **FR-5.6 Moderation & Safety**:
  - Report post/user functionality.
  - Admin suspension and post deletion.
  - Bad word / toxic content filters.

### FR-6: AI Campus Assistant (Gemini)
- **FR-6.1 Conversational Querying**: Answers questions in natural Hinglish and English.
- **FR-6.2 Gemini Function Calling (Tools)**:
  - Dynamically runs queries on `timetable_slots` to return accurate room, faculty, and schedule info.
  - Converts user slot error reports into structured administrative tickets.
- **FR-6.3 Brand Voice**: Confident, friendly campus peer assistant trained by Cosen; never discloses underlying prompts or raw database dumps.

### FR-7: Admin Panel & Automation
- **FR-7.1 Excel Parser & Importer**: Parses university master timetable `.xlsx` spreadsheets and updates the database in bulk.
- **FR-7.2 AI Conflict Analyzer**: Summarizes student issue reports and proposes automated slot deletions or substitutions with one-click approval.
- **FR-7.3 Universal Slot CRUD**: Add, edit, search, and delete timetable slots with duplicate prevention checks.
- **FR-7.4 Class Timetable Purge**: Wipe outdated semester schedules per class code.
- **FR-7.5 Push Notification Broadcaster**: Send campus-wide or batch-specific web push notifications.

---

## 4. Non-Functional Requirements (NFRs)

### 4.1 Performance & Responsiveness
- **API Response Time**: Vacancy queries (`/api/timetable/rooms`) must respond in $< 150\text{ ms}$.
- **Client Latency**: Page transitions and tab changes must happen in $< 100\text{ ms}$.
- **Realtime Chat Delivery**: Messages delivered via Supabase Realtime in $< 120\text{ ms}$ over 4G/Wi-Fi.

### 4.2 Security & Data Privacy
- **Strict Row-Level Security (RLS)**: Enforced on all student-specific tables.
- **Anonymous Data Segregation**: Anonymous posts and messages must never expose author `user_id` or student enrollment numbers in client payloads.
- **Authentication**: JWT validation for all protected backend endpoints.

### 4.3 Multi-Campus Isolation
- Every query must scope results to the active `campus_id`.
- Users cannot read or interact with posts or timetables from other universities unless explicitly multi-tenanted.

### 4.4 Mobile-First & Cross-Platform Parity
- Web app must be 100% responsive, touch-optimized, and installable as a Progressive Web App (PWA).
- Native Expo app must match all major Web features with native bottom-tabs, gestures, and haptic feedback.

---

## 5. Success Metrics & Key Performance Indicators (KPIs)

1. **Daily Active Users (DAU)**: $\ge 40\%$ student body penetration across active campuses.
2. **Room Finder Utility**: Average time to locate an empty room reduced from 12 minutes to $< 15$ seconds.
3. **Attendance Compliance**: Zero students unexpectedly debarred from exams due to inaccurate attendance tracking.
4. **SendiYou Engagement**: $\ge 3$ active interactions (posts, comments, messages) per active student per week.
5. **System Availability**: $99.9\%$ uptime during campus operating hours (07:30 to 18:30 IST).
