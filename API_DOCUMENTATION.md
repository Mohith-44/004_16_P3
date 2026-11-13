# Hospital Ward Alert Dispatcher – REST API Documentation

Base URL: `/api`  
Authentication: Bearer JWT (`Authorization: Bearer <token>`)

## 1. Authentication

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Register user (`Admin`, `Nurse / Reporter`, `Handler`, `Routing Manager`). |
| `POST` | `/api/auth/login` | Public | Authenticate with email and password; returns JWT and user profile. |
| `GET` | `/api/auth/me` | Protected | Return current authenticated user and linked handler profile. |
| `PUT` | `/api/auth/profile` | Protected | Update user profile details and workspace preferences. |
| `PUT` | `/api/auth/password` | Protected | Verify current password and update to a new password. |

## 2. Reports

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/reports` | Optional Auth | Submit a new ward alert report with unique Report ID generation/validation. |
| `GET` | `/api/reports` | Protected | List reports with search (`q`), `category`, `priority`, `status`, `zone`, `department`, `mine`, and summary counts. |
| `GET` | `/api/reports/track/:reportId` | Public | Look up a report by its unique `reportId` (e.g., `RPT-20261113-1001`). |
| `GET` | `/api/reports/:id` | Protected | Retrieve full report details and `statusHistory` by Mongo `_id` or `reportId`. |
| `PUT` | `/api/reports/:id` | Admin / Handler / Routing Manager | Update report assignment, department, priority, resolution notes, and status history. |
| `PATCH` | `/api/reports/:id/status` | Admin / Handler / Routing Manager | Transition status (`Pending`, `Assigned`, `In Progress`, `Resolved`) with remarks. |

## 3. Handlers

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/handlers` | Protected | List hospital handlers with live active workloads. |
| `POST` | `/api/handlers` | Admin / Routing Manager | Create a new handler record. |
| `PUT` | `/api/handlers/:id` | Admin / Routing Manager / Handler | Update handler details. |
| `PATCH` | `/api/handlers/:id/availability` | Admin / Routing Manager / Handler | Update availability (`Available`, `Busy`, `On Break`, `Off Duty`). |
| `PATCH` | `/api/handlers/:id/capacity` | Admin / Routing Manager / Handler | Update maximum workload capacity (1–50). |

## 4. Departments

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/departments` | Public | List all hospital departments. |
| `POST` | `/api/departments` | Admin / Routing Manager | Create a new hospital department. |
| `PUT` | `/api/departments/:id` | Admin / Routing Manager | Update department metadata. |
| `DELETE` | `/api/departments/:id` | Admin | Delete a department record. |

## 5. Routing Rules

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/routing` | Protected | List routing records with handler availability, workload, and queued report counts. |
| `POST` | `/api/routing` | Admin / Routing Manager | Create a manual routing rule. |
| `PUT` | `/api/routing/:id` | Admin / Routing Manager | Edit a routing rule (primary/backup handler, escalation, priority override). |
| `DELETE` | `/api/routing/:id` | Admin / Routing Manager | Delete a routing rule. |

## 6. Analytics

All analytics endpoints support query parameters: `startDate`, `endDate`, `category`, `zone`, `priority`, `status`.

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/analytics/overview` | Protected | Totals, resolution rate, daily trends, weekly stats, department & priority distributions. |
| `GET` | `/api/analytics/categories` | Protected | Category-wise report distribution across all 5 categories. |
| `GET` | `/api/analytics/zones` | Protected | Zone-wise report distribution across hospital wings. |
| `GET` | `/api/analytics/status` | Protected | Status-wise counts (`Pending`, `Assigned`, `In Progress`, `Resolved`). |

## 7. Notifications

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/notifications` | Protected | Fetch notifications and unread count for the current user. |
| `PATCH` | `/api/notifications/:id/read` | Protected | Mark a single notification as read. |
| `PATCH` | `/api/notifications/read-all` | Protected | Mark all notifications for the current user as read. |
