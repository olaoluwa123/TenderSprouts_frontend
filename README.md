# School Portal Frontend

React + TypeScript frontend for the School Portal backend API.

## Stack

- **Vite** + **React 19** + **TypeScript**
- **React Router** — role-based navigation (Admin / Teacher / Parent)
- **TanStack Query** — data fetching
- **Tailwind CSS v4** — styling
- **Lucide React** — icons

## Getting started

```bash
# Install dependencies
npm install

# Start dev server (port 3000, proxies /api → localhost:8080)
npm run dev
```

Ensure the Spring Boot backend is running on `http://localhost:8080`.

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `/api` | API base path (proxied in dev) |

## Features by role

### Admin (21 modules)
Users, Students, Parents, Bulk Promote, Sessions, Classes & Subjects, Teachers, Grades, Attendance, Term Results, Fees, Invoices, Calendar, Announcements, Messages, Admin Messages, Notifications, Analytics, Periods, Timetable, Exam Timetable

### Teacher
Dashboard, Attendance, Grades, Term Results (read), Timetable, Exam Timetable, Calendar, Announcements, Messages, Notifications

### Parent
Dashboard, Children, Grades, Attendance, Report Cards (JSON + PDF), Fees, Timetable, Exam Timetable, Calendar, Messages, Notifications

### Auth (public)
Login, Forgot password, Reset password

## Build

```bash
npm run build
npm run preview
```
