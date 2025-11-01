const API = 'http://localhost:3000';

async function fetchInsights() {
  try {
    const r = await fetch(API + '/insights');
    const data = await r.json();
    document.getElementById('insightText').innerText = data.insight || JSON.stringify(data);
  } catch(err) {
    document.getElementById('insightText').innerText = 'Failed to load insights';
    console.error(err);
  }
}

async function fetchTasks() {
  const status = document.getElementById('filterStatus').value;
  const sort = document.getElementById('sortBy').value;
  let url = API + '/tasks';
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (sort) params.set('sort', sort);
  if ([...params].length) url += '?' + params.toString();
  try {
    const r = await fetch(url);
    const tasks = await r.json();
    renderTasks(tasks);
  } catch(err) {
    console.error(err);
  }
}

function renderTasks(tasks) {
  const ul = document.getElementById('tasks');
  ul.innerHTML = '';
  if (!tasks || tasks.length === 0) { ul.innerHTML = '<li>No tasks</li>'; return; }
  for (const t of tasks) {
    const li = document.createElement('li');
    li.className = 'task';
    li.innerHTML = `
      <strong>${escapeHtml(t.title)}</strong>
      <div class="meta">Priority: ${t.priority} | Status: ${t.status} | Due: ${t.due_date}</div>
      <div>${escapeHtml(t.description || '')}</div>
      <div class="actions"></div>
    `;
    const actions = li.querySelector('.actions');

    const toggleBtn = document.createElement('button');
    toggleBtn.innerText = t.status === 'Done' ? 'Mark Open' : 'Mark Done';
    toggleBtn.onclick = async () => {
      const newStatus = t.status === 'Done' ? 'Open' : 'Done';
      await fetch(API + '/tasks/' + t.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      await reloadAll();
    };
    actions.appendChild(toggleBtn);

    const delBtn = document.createElement('button');
    delBtn.innerText = 'Delete';
    delBtn.onclick = async () => {
      if (!confirm('Delete task?')) return;
      await fetch(API + '/tasks/' + t.id, { method: 'DELETE' });
      await reloadAll();
    };
    actions.appendChild(delBtn);

    ul.appendChild(li);
  }
}

function escapeHtml(unsafe) {
  return unsafe
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

async function reloadAll() {
  await fetchTasks();
  await fetchInsights();
}

document.getElementById('addTaskForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const data = {
    title: f.title.value.trim(),
    description: f.description.value.trim(),
    priority: f.priority.value,
    due_date: f.due_date.value
  };
  if (!data.title || !data.due_date) { alert('Title and due date required'); return; }
  await fetch(API + '/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  f.reset();
  await reloadAll();
});

document.getElementById('applyFilters').addEventListener('click', () => reloadAll());

// initial load
reloadAll();
