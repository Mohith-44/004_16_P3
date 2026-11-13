# Hospital Ward Alert Dispatcher (Part C – Web Application)

A complete MERN stack (MongoDB, Express.js, React, Node.js) healthcare SaaS platform for submitting, tracking, assigning, routing, and analyzing hospital ward alert reports across clinical departments.

## Scope

This project implements **Part C – Frontend and Web Application Development**:
- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router DOM, Axios, Recharts, Lucide React.
- **Backend**: Node.js, Express.js REST APIs, JWT authentication, bcrypt password hashing, Role-Based Access Control (RBAC).
- **Database**: MongoDB with Mongoose models (`User`, `Report`, `Handler`, `Department`, `RoutingRule`, `Notification`).

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment configuration** (optional):
   - Copy `.env.example` to `.env` if you want to connect to an external MongoDB instance (`MONGODB_URI`).
   - If `MONGODB_URI` is omitted, the server automatically launches an in-memory MongoDB server and seeds sample departments, staff accounts, routing rules, reports, and notifications on startup.

3. **Run in development mode**:
   ```bash
   npm run dev
   ```
   The Express API and Vite frontend run together on `http://localhost:3000`.

4. **Build for production**:
   ```bash
   npm run build
   ```

## Demo Accounts

All seeded accounts use password `Hospital@123`:

| Role | Email | Default Workspace |
| --- | --- | --- |
| **Nurse / Reporter** | `nurse.elena@hospitalward.org` | User Dashboard & Report Submission |
| **Handler** | `handler.marcus@hospitalward.org` | Handler Desk (Biomedical Engineering) |
| **Routing Manager** | `routing.priya@hospitalward.org` | Routing Management Dashboard |
| **Admin** | `admin@hospitalward.org` | Full Platform Access |

## Implemented Pages

1. **Login Page** (`/login`)
2. **Registration Page** (`/register`)
3. **Main Dashboard** (`/dashboard`)
4. **Report Submission Page** (`/submit-report`)
5. **All Reports Page** (`/reports`)
6. **Report Details Page** (`/reports/:id`)
7. **Track Report Page** (`/track` & `/track-public`)
8. **Handler Dashboard** (`/handler-dashboard`)
9. **Routing Management Dashboard** (`/routing`)
10. **Analytics Dashboard** (`/analytics`)
11. **Notifications Page** (`/notifications`)
12. **User Profile Page** (`/profile`)
13. **Settings Page** (`/settings`)
