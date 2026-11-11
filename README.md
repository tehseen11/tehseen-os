# Tehseen OS – Personal Productivity & Daily Life Management System

**Tehseen OS** is a premium, private, local-first personal productivity and daily routine management web application crafted specifically for daily planning, deep work consistency, DevOps & technical learning, habit tracking, and performance analytics.

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Dexie.js (IndexedDB)**, and **Recharts**, it works 100% offline without requiring servers, cloud subscriptions, or paid APIs.

---

## 🌟 Key Capabilities

### 1. Daily Planning & Task Management
- **Comprehensive Task Metadata**: Title, description, date, start time, due time, priority (`Urgent`, `High`, `Medium`, `Low`), category tags (`DevOps Learning`, `Work`, `Personal`, etc.), reminder flags, and duration tracking.
- **One-Click Completion & Instant Undo**: Fluid animations, milestone celebration confetti, and safety undo controls.
- **Overdue Task Automation**: Proactive banner highlighting past unfinished tasks with a 1-click **"Move All to Today"** rollover action.
- **Multi-dimensional Filtering**: Filter by priority, category, status (`All`, `Pending`, `Completed`, `Overdue`), and real-time title/note search.

### 2. Smart Calendar & Timeline Integration
- **Month, Week, & Day Views**: Interactive navigation between dates and months.
- **Unified Timeline**: Seamless chronological view interleaving calendar meetings and time-blocked tasks.
- **Activity Inspector**: Click any date on the calendar to inspect activities, schedule new events, or add timed commitments.

### 3. Habit Tracker & Consistency Matrix
- **Habit Streaks**: Tracks current consecutive streaks, all-time best streaks, and 30-day completion rates.
- **GitHub-Style 60-Day Heatmap**: Visual contribution matrix tracking your daily discipline over time.
- **Resilient Data**: Missing a single day never destroys historical log records.

### 4. Transparent Productivity Scoring (0 – 100)
- **Mathematical Formula**:
  - Task Completion: 50%
  - Habit Consistency: 25%
  - Deep Focus Sessions: 15%
  - Daily Reflection: 10%
- **Rest Day Protection**: Scheduled rest days (configurable in settings) reduce targets so you aren't penalized for planned recovery.
- **Inspectable Scoring Modal**: Click "Formula" on the dashboard to see exactly how every single point was earned.

### 5. Focus Mode (Pomodoro Timer)
- **Presets**: 25-minute Pomodoro, 5-minute Short Break, 15-minute Long Break.
- **Linked Sessions**: Connect a focus sprint directly to any of today's planned tasks.
- **Audio Synthesizer**: Uses browser Web Audio API to synthesize victory chimes on completion without relying on external audio files.

### 6. Daily Journal & Reality Check Wizard
- **Evening Reflection**: Guided prompts for accomplishments, key learnings, blockers, and tomorrow's top priorities.
- **Daily Reality Check**: Automated end-of-day audit comparing planned vs completed tasks, logging root causes for missed goals and single key shifts for tomorrow.
- **Mood Tracking**: Log your mental energy and emotional state daily.

### 7. Quick Notes Workspace
- **Pinned Scratchpad**: Fast note-taking with category tagging and pin-to-top support.
- **Dashboard Widget**: Immediate access to pinned technical snippets and commands.

### 8. Notifications & Reminders
- **Native Browser Notifications**: Timely alerts for scheduled tasks and calendar events.
- **In-App Notification Center**: Snooze alerts for 15 minutes, mark as read, or dismiss.
- **Honest System Limitations**: Acknowledges mobile OS background sleep behavior and provides persistent in-app IndexedDB fallbacks.

### 9. Privacy, Backup & Portability
- **Local-First Storage**: All data stays private in your browser's IndexedDB. Zero tracking.
- **Full JSON Export / Import**: Download complete backups anytime and restore them with 1-click.
- **CSV Analytics Export**: Export daily performance and score trends to CSV for external analysis.

---

## 📱 Mobile-First PWA Experience

Tehseen OS is configured as an installable Progressive Web Application (PWA).

### How to Install on Android:
1. Open Chrome on your Android smartphone.
2. Navigate to your Tehseen OS address (e.g. `http://<your-lan-ip>:3000`).
3. Tap the **three dots menu (⋮)** in the top right corner.
4. Tap **"Add to Home screen"** or **"Install app"**.
5. Tehseen OS will appear on your phone home screen and app launcher with its custom icon, splash screen, and full offline functionality!

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17+ or 20+
- npm 9+

### Running the App
```bash
# Navigate to project directory
cd tehseen-os

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production
```bash
npm run build
npm start
```
