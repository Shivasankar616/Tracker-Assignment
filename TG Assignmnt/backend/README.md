# Task Tracker Backend

## Requirements
- Node.js (14+)
- npm

## Setup
1. `cd backend`
2. `npm install`
3. `npm start`

The server listens on port 3000 by default.

## Endpoints
- `POST /tasks` - create a task. Body: { title, description, priority, due_date, status }
- `GET /tasks` - list tasks. Query: `status`, `priority`, `sort=due_date`
- `PATCH /tasks/:id` - update fields: title, description, priority, due_date, status
- `DELETE /tasks/:id` - delete a task
- `GET /insights` - compute summary string and statistics
