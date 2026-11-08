# 🎨 Timbel Design System & Style Guide

> **Brand Identity**: Cosen Timbel (Campus Super-App & Timetable Intelligence)  
> **Aesthetic Theme**: Dark Cosmic Glassmorphism  
> **Platform Parity**: React 19 Web (Tailwind v4) ⇄ React Native Expo (NativeWind v4)  
> **Status**: Official System Specification  

---

## 1. Visual Identity & Brand Philosophy

Timbel’s design philosophy balances **technical precision** with **futuristic, tactile warmth**:
- **Cosmic Dark Canvas**: The university environment is full of visual noise. Timbel creates calm with deep, rich dark backgrounds (`#060C20`) that make timetable statuses instantly legible without eye strain.
- **Vibrant Semantic Radiance**: Emerald green (`#10B981`), Amber (`#F59E0B`), and Crimson (`#EF4444`) provide immediate, glanceable situational awareness for classroom and attendance availability.
- **Frosted Glassmorphism**: Cards and panels float above a cosmic gradient or 3D canvas with blurred translucency (`backdrop-blur-md`), giving a sense of depth and lightweight hierarchy.
- **Pill Geometry**: Strict adherence to pill and circular rounded corners (`rounded-full`, `rounded-2xl`) removes rigidity and feels natural on touch screens.

---

## 2. Color Palette & Token Specifications

### 2.1 Surfaces & Structural Grays

| Token | Hex / RGBA | Role / Usage |
|-------|------------|--------------|
| `--color-slate-darker` | `#060C20` | Root background for entire Web and Mobile canvas |
| `--color-slate-deep` | `#0F172A` | Elevated containers, sidebars, bottom tab backgrounds |
| `--color-slate-card` | `#1E293B` | Base surface for cards, modals, and list items |
| `--color-slate-border` | `#334155` | Hairline dividers, modal borders, input outlines |
| `--color-glass` | `rgba(30, 41, 59, 0.70)` | Glassmorphism cards with `backdrop-filter: blur(16px)` |
| `--color-overlay` | `rgba(6, 12, 32, 0.85)` | Modal scrim and drawer backdrop |

### 2.2 Brand & Accents

| Token | Hex / RGBA | Role / Usage |
|-------|------------|--------------|
| `--color-violet-primary` | `#635BFF` | Primary action buttons, active navigation indicators, key branding |
| `--color-violet-hover` | `#7C75FF` | Hover and active tap feedback for primary buttons |
| `--color-violet-glow` | `rgba(99, 91, 255, 0.15)` | Subtle glow shadows behind featured elements |
| `--color-accent-pink` | `#EC4899` | Secondary accent for SendiYou highlights and badges |
| `--color-accent-cyan` | `#06B6D4` | Accent highlight for AI Assistant interactions |

### 2.3 Semantic Status Colors

| Status | Primary Color | Soft Badge Fill | Meaning |
|--------|---------------|-----------------|---------|
| **FREE** | `#10B981` (Emerald) | `rgba(16, 185, 129, 0.15)` | Room is vacant / Attendance is in the safe zone ($\ge 75\%$) |
| **SOON** | `#F59E0B` (Amber) | `rgba(245, 158, 11, 0.15)` | Class starting within $\le 15$ min / Attendance in warning zone ($70\text{--}74.9\%$) |
| **BUSY** | `#EF4444` (Crimson) | `rgba(239, 68, 68, 0.15)` | Room occupied / Attendance critical ($< 70\%$, risk of debarment) |

### 2.4 Typography & Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-text-primary` | `#F8FAFC` | Headings, room codes, active button labels, critical text |
| `--color-text-secondary` | `#94A3B8` | Body paragraphs, faculty names, subject codes, subtitles |
| `--color-text-muted` | `#64748B` | Timestamps, caption text, placeholder text, inactive tabs |

---

## 3. Typography Scale

Both Web and Mobile standardize on **Inter** for headings and body, and **JetBrains Mono** for numbers, timestamps, and codes.

```
Display Large:   32px / Bold (700)      - Hero titles, landing page highlights
Headline 1:      24px / Bold (700)      - Screen headers, Page titles
Headline 2:      20px / SemiBold (600)  - Section headers, Modal titles
Subhead / H3:    16px / SemiBold (600)  - Card titles, Room names, Subject names
Body Regular:    15px / Regular (400)   - Standard readable content
Body Small:      13px / Medium (500)    - Secondary labels, slot time spans
Mono / Caption:  12px / Medium (500)    - JetBrains Mono for '08:00 - 09:00', room badges
```

---

## 4. Component Standards

### 4.1 Buttons
- **Primary Action (`button-primary`)**:
  - Background: `#635BFF`, Text: `#FFFFFF`, Radius: `rounded-full` (Pill).
  - Web: Padding `10px 24px`, font size `15px`, bold `600`.
  - Hover: Background `#7C75FF`, transform `translateY(-1px)`.
- **Secondary / Glass (`button-glass`)**:
  - Background: `rgba(30, 41, 59, 0.60)`, Border: `1px solid #334155`, Text: `#F8FAFC`.
  - Radius: `rounded-full`.
- **Icon Circular (`button-icon`)**:
  - Size: `40px x 40px` (or `44px` touch target on mobile), Radius: `rounded-full`.
  - Background: `rgba(30, 41, 59, 0.50)` with centered Lucide icon.

### 4.2 Room Status Cards
- **Container**: `glass-card` styling with `bg-[#1E293B]/70`, `backdrop-blur-md`, `border-[#334155]/60`, radius `rounded-2xl`.
- **Header**: Room code in bold display font alongside the semantic `StatusBadge` (Pill badge with pulsating dot).
- **Body**: Shows current availability timeline (e.g. "Free until 12:45 PM" or "BUSY: Data Structures Lab with Dr. Patel").
- **Footer**: Action pill to toggle day-long schedule accordion.

### 4.3 SendiYou Feed Cards
- **Geometry**: Rounded `rounded-2xl` cards floating on dark canvas.
- **Top Row**: Animated Lottie icon representing category (Study, Crush, Chill, Lost & Found) next to an anonymous alias tag (e.g., `#AnonymousStudent` or `#StealthTiger`).
- **Description**: High-contrast body text with generous line height ($1.5$).
- **Interaction Row**: Reply button, chat trigger pill, and report flag.

### 4.4 Chat Interface
- **Sent Message (Me)**: Aligned right, background `#635BFF`, text `#FFFFFF`, rounded `rounded-2xl rounded-br-sm`.
- **Received Message (Other)**: Aligned left, background `#1E293B`, text `#F8FAFC`, border `1px solid #334155`, rounded `rounded-2xl rounded-bl-sm`.
- **System / Notification Message**: Centered pill with `bg-slate-800/80`, text `text-slate-400`, font size `12px`.

---

## 5. Animation & Motion Design

1. **Animated Loading States**: Default spinners are prohibited. All loading screens and suspense fallbacks must use the custom `loder.json` Lottie animation.
2. **AI Assistant Pulse**: The floating AI assistant widget integrates `assistent.json` with gentle idle bobbing (`float-y` keyframe).
3. **Card Lift**: On desktop, cards lift by $-2\text{px}$ with a soft shadow on hover (`transition: transform 0.2s ease`).
4. **Smooth Transitions**: Modals, bottom sheets, and accordions animate with standard cubic bezier (`cubic-bezier(0.16, 1, 0.3, 1)`).

---

## 6. Mobile & Touch Ergonomics

- **Minimum Tap Targets**: All buttons, chips, and selectors must maintain a touchable footprint of at least $44\text{px} \times 44\text{px}$.
- **Safe Area Insets**: Screens must respect notch, dynamic island, and bottom home bar padding.
- **Bottom Navigation**: Top-level routes (Finder, Classes, Attendance, SendiYou, Profile) anchor to the bottom thumb zone with frosted glass blur.

---

## 7. Do's and Don'ts

### ✅ Do
- Always use semantic status colors (`#10B981`, `#F59E0B`, `#EF4444`) consistently for room and attendance states.
- Maintain dark cosmic background `#060C20` across all screens to protect nighttime legibility.
- Use pill buttons (`rounded-full`) for all primary actions.
- Provide immediate haptic or visual feedback on card touches.

### ❌ Don't
- Do NOT introduce plain white background cards — bright white destroys the cosmic glassmorphic hierarchy.
- Do NOT use square or sharp corners for actionable buttons.
- Do NOT use standard browser `alert()` or raw CSS spinners.
- Do NOT mix arbitrary accent colors that clash with `#635BFF`.