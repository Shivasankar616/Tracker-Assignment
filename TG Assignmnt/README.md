# Task Tracker (Full-stack mini project)

This project is a minimal implementation of the THworks assignment:
- Backend: Node.js + Express + better-sqlite3
- Frontend: Vanilla JS (fetch API)

## How to run

### Backend
1. Open terminal
2. `cd backend`
3. `npm install`
4. `npm start`
Server starts on http://localhost:3000

### Frontend
Serve the `frontend/` folder as static files. Easiest:
- `cd frontend`
- `python3 -m http.server 8080` (or open `frontend/index.html` directly in browser)
- Open http://localhost:8080 in browser

The frontend expects the backend at http://localhost:3000.

## Files
- `backend/` - Node backend and SQLite DB (task_tracker.db created automatically)
- `frontend/` - static frontend files

## Notes
- This implementation uses vanilla JS for simplicity (React is also allowed).
- See `backend/README.md` for backend API details.
