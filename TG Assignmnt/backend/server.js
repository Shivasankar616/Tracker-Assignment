const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'task_tracker.db');
const db = new Database(DB_FILE);

// Initialize table if not exists
db.exec(`
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK(priority IN ('Low','Medium','High')) NOT NULL DEFAULT 'Medium',
  due_date TEXT NOT NULL,
  status TEXT CHECK(status IN ('Open','In Progress','Done')) NOT NULL DEFAULT 'Open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// Helpers
function getTaskById(id) {
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  return stmt.get(id);
}

// POST /tasks -> create
app.post('/tasks', (req, res) => {
  const { title, description = '', priority = 'Medium', due_date, status = 'Open' } = req.body;
  if(!title || !due_date) {
    return res.status(400).json({ error: 'title and due_date are required' });
  }
  const insert = db.prepare('INSERT INTO tasks (title, description, priority, due_date, status) VALUES (?, ?, ?, ?, ?)');
  const info = insert.run(title, description, priority, due_date, status);
  const created = getTaskById(info.lastInsertRowid);
  res.status(201).json(created);
});

// GET /tasks -> list with optional filters: status, priority, sort (due_date)
app.get('/tasks', (req, res) => {
  const { status, priority, sort } = req.query;
  let sql = 'SELECT * FROM tasks';
  const clauses = [];
  const params = [];

  if (status) { clauses.push('status = ?'); params.push(status); }
  if (priority) { clauses.push('priority = ?'); params.push(priority); }
  if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
  if (sort === 'due_date') sql += ' ORDER BY due_date ASC';
  else sql += ' ORDER BY created_at DESC';

  const stmt = db.prepare(sql);
  const tasks = stmt.all(...params);
  res.json(tasks);
});

// PATCH /tasks/:id -> update fields (title, description, priority, due_date, status)
app.patch('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const allowed = ['title','description','priority','due_date','status'];
  const fields = [];
  const params = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(req.body[key]);
    }
  }
  if (fields.length === 0) return res.status(400).json({ error: 'no updatable fields provided' });

  params.push(id);
  const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
  const stmt = db.prepare(sql);
  const info = stmt.run(...params);
  if (info.changes === 0) return res.status(404).json({ error: 'task not found' });
  const updated = getTaskById(id);
  res.json(updated);
});

// DELETE /tasks/:id
app.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  const info = stmt.run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'task not found' });
  res.json({ success: true });
});

// GET /insights -> compute simple statistics and return a summary string
app.get('/insights', (req, res) => {
  // total open
  const totalOpen = db.prepare("SELECT COUNT(*) AS c FROM tasks WHERE status = 'Open'").get().c;

  // distribution by priority (for open tasks)
  const distStmt = db.prepare("SELECT priority, COUNT(*) AS c FROM tasks WHERE status = 'Open' GROUP BY priority");
  const rows = distStmt.all();
  const priorityDistribution = { Low: 0, Medium: 0, High: 0 };
  for (const r of rows) { priorityDistribution[r.priority] = r.c; }

  // due soon: within next 7 days (including today) for open tasks
  const now = new Date();
  const nowISO = now.toISOString().split('T')[0];
  const future = new Date(now);
  future.setDate(now.getDate() + 7);
  const futureISO = future.toISOString().split('T')[0];

  const dueSoonStmt = db.prepare("SELECT COUNT(*) AS c FROM tasks WHERE status = 'Open' AND date(due_date) BETWEEN date(?) AND date(?)");
  const dueSoonCount = dueSoonStmt.get(nowISO, futureISO).c;

  // dominant priority
  const dominantPriority = Object.entries(priorityDistribution).sort((a,b) => b[1]-a[1])[0][0] || 'Medium';

  // Build human readable insight
  let insight = `You have ${totalOpen} open task${totalOpen === 1 ? '' : 's'}.`;
  if (dueSoonCount > 0) insight += ` ${dueSoonCount} ${dueSoonCount === 1 ? 'is' : 'are'} due in the next 7 days.`;
  insight += ` Most of your open tasks are ${dominantPriority} priority.`;
  // include a small breakdown
  insight += ` Priority breakdown — High: ${priorityDistribution.High}, Medium: ${priorityDistribution.Medium}, Low: ${priorityDistribution.Low}.`;

  res.json({
    totalOpen,
    priorityDistribution,
    dueSoonCount,
    insight
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
