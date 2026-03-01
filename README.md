# Ladder - Squash Club Ladder Management System

A full-stack web application for managing a competitive squash club ladder. Handles player rankings, weekly draw generation, match submission, result processing, and admin management.

---

## Features

- **Ladder Rankings** — Live standings with player positions, statuses, and shield protection
- **Weekly Draw Generation** — Automatic pairing of adjacent-ranked players with intelligent time slot assignment
- **Match Submission** — Players submit results online; opponent entry is auto-generated
- **Result Processing** — Admins approve results and process the week to update ladder positions
- **Role-Based Access** — Members, admins, and draw admins with separate permissions
- **Player Profiles** — Preferences (earliest play time), contact info, squash grade, junior status
- **Results History** — Browse past weeks' match results and personal statistics
- **Shield System** — Protects players from being challenged below their position

---

## Tech Stack

| Layer      | Technology                                |
| ---------- | ----------------------------------------- |
| Frontend   | React, Vite                               |
| Backend    | Node.js, Express                          |
| Database   | PostgreSQL                                |
| Auth       | JWT, bcrypt                               |
| Deployment | Docker, Docker Compose, Vercel (frontend) |

---

## Project Structure

```
ladder/
├── backend/
│   ├── config/
│   │   └── db.js               # PostgreSQL connection pool
│   ├── middleware/
│   │   └── auth.js             # JWT auth & role-based access
│   ├── routes/
│   │   ├── auth.js             # Registration, login, password
│   │   ├── ladder.js           # Ladder positions & status
│   │   ├── draw.js             # Weekly draw generation & management
│   │   ├── matches.js          # Match submission & processing
│   │   ├── profile.js          # User profiles & preferences
│   │   ├── results.js          # Historical results
│   │   └── users.js            # User management
│   ├── schema.sql              # Database schema
│   ├── server.js               # Express entry point
│   ├── dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Ladder.jsx
│   │   │   ├── Draw.jsx
│   │   │   ├── SubmitMatch.jsx
│   │   │   ├── SubmitMatchForm.jsx
│   │   │   ├── Admin.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Results.jsx
│   │   │   └── login.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.jsx
│   ├── vite.config.js
│   ├── vercel.json
│   └── package.json
│
└── docker-compose.yml
```

---

## API Overview

### Auth — `/api/auth`

| Method | Endpoint                  | Description                    |
| ------ | ------------------------- | ------------------------------ |
| POST   | `/register`               | Register a new user            |
| POST   | `/login`                  | Authenticate and receive JWT   |
| GET    | `/me`                     | Get current user info          |
| PUT    | `/change-password`        | Change own password            |
| POST   | `/reset-password/:userId` | Admin: reset a user's password |

### Ladder — `/api/ladder`

| Method | Endpoint          | Description                                  |
| ------ | ----------------- | -------------------------------------------- |
| GET    | `/`               | All ladder positions (public)                |
| GET    | `/me`             | Current user's position                      |
| PATCH  | `/status`         | Update own status (active/withdrawn/no_play) |
| DELETE | `/withdraw`       | Self-withdraw from ladder                    |
| POST   | `/add`            | Admin: add user to ladder                    |
| PUT    | `/:id`            | Admin: update position                       |
| PATCH  | `/shield/:userId` | Admin: toggle shield                         |

### Draw — `/api/draw`

| Method | Endpoint                | Description                               |
| ------ | ----------------------- | ----------------------------------------- |
| GET    | `/current`              | Current published draw                    |
| GET    | `/week/:date`           | Draw for a specific week                  |
| POST   | `/generate`             | Admin: generate draw with auto time slots |
| PATCH  | `/:id`                  | Admin: update a pairing                   |
| PATCH  | `/week/:date/publish`   | Admin: publish draw                       |
| PATCH  | `/week/:date/unpublish` | Admin: unpublish draw                     |
| DELETE | `/week/:date`           | Admin: delete entire week                 |
| PUT    | `/week-notes`           | Admin: update week notes                  |

### Matches — `/api/matches`

| Method | Endpoint                  | Description                           |
| ------ | ------------------------- | ------------------------------------- |
| POST   | `/submit`                 | Submit match result                   |
| GET    | `/my-match`               | Current week's match for user         |
| GET    | `/my-results`             | User's past results                   |
| GET    | `/pending`                | Admin: all unapproved results         |
| POST   | `/approve-match/:matchId` | Admin: approve both player results    |
| POST   | `/approve-all`            | Admin: bulk approve all pending       |
| POST   | `/process-week/:date`     | Admin: process week and update ladder |

### Profile — `/api/profile`

| Method | Endpoint       | Description                               |
| ------ | -------------- | ----------------------------------------- |
| GET    | `/me`          | Full profile with ladder position         |
| GET    | `/history`     | Match history (last 20)                   |
| GET    | `/stats`       | Win/loss statistics                       |
| PUT    | `/preferences` | Update earliest time & notes              |
| PUT    | `/contact`     | Update email, phone, grade, junior status |

---

## Database Schema

**Core tables:**

- `users` — Player accounts, auth info, roles, contact details
- `ladder_positions` — Current rankings with status and shield flags
- `draws` — Weekly pairings with time slots and published state
- `matches` — Match results with set scores and approval status
- `user_preferences` — Earliest available play time and notes
- `ladder_history` — Snapshots of ladder positions by week
- `week_notes` — Admin notes attached to a draw week

**User roles:** `member`, `admin`, `draw_admin`, `junior`

**Match outcomes:** Win 3-0, Win 2-1, Win 1-2, Loss 0-3, No Play, Default

---

## Draw Generation Logic

1. Players are sorted by current ladder position.
2. Adjacent players are paired (1 vs 2, 3 vs 4, etc.).
3. Juniors are identified and assigned earlier time slots.
4. Time slots (5:00 pm – 10:30 pm in 30-minute intervals) are assigned respecting each player's earliest available time preference.
5. The draw is saved as unpublished until an admin publishes it.

## Ladder Position Updates

After a week is processed, positions shift based on match outcomes:

| Result   | Points |
| -------- | ------ |
| Win 3-0  | +6     |
| Win 2-1  | +3     |
| Win 1-2  | 0      |
| Loss 0-3 | -1     |

---

## Admin Panel

The admin panel (`/admin`) provides full control over:

- Generating, editing, publishing, and deleting weekly draws
- Approving or rejecting individual match results
- Bulk-approving all pending results
- Processing the week to recalculate ladder positions
- Managing users, ladder positions, and statuses
- Viewing all player preferences
- Toggling shields on players
