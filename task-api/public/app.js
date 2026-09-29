const state = {
  tasks: [],
  status: 'all',
  search: '',
  sort: 'newest',
  assignTaskId: null,
};

const $ = (selector) => document.querySelector(selector);

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Request failed');
  }

  return response.status === 204 ? null : response.json();
}

async function loadTasks() {
  state.tasks = await api('/tasks');
  render();
  await loadStats();
}

async function loadStats() {
  const stats = await api('/tasks/stats');
  $('#todoCount').textContent = stats.todo;
  $('#progressCount').textContent = stats.in_progress;
  $('#doneCount').textContent = stats.done;
  $('#overdueCount').textContent = stats.overdue;
}

function formatDate(date) {
  if (!date) return 'No due date';
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function priorityRank(priority) {
  return { high: 0, medium: 1, low: 2 }[priority] ?? 3;
}

function visibleTasks() {
  return state.tasks
    .filter((task) => state.status === 'all' || task.status === state.status)
    .filter((task) => {
      const query = state.search.toLowerCase();
      return !query ||
        task.title.toLowerCase().includes(query) ||
        (task.description || '').toLowerCase().includes(query) ||
        (task.assignee || '').toLowerCase().includes(query);
    })
    .sort((a, b) => {
      if (state.sort === 'priority') return priorityRank(a.priority) - priorityRank(b.priority);
      if (state.sort === 'due') {
        return (a.dueDate || '9999') .localeCompare(b.dueDate || '9999');
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

function statusLabel(status) {
  return { todo: 'To do', in_progress: 'In progress', done: 'Done' }[status];
}

function render() {
  const tasks = visibleTasks();
  const list = $('#taskList');
  $('#emptyState').classList.toggle('hidden', tasks.length !== 0);

  list.innerHTML = tasks.map((task) => {
    const overdue = task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date();

    return `
      <article class="task ${task.status === 'done' ? 'done' : ''}">
        <div class="task-main">
          <p class="task-title">${escapeHtml(task.title)}</p>
          <p class="task-description">${escapeHtml(task.description || 'No description')}</p>
          <div class="meta">
            <span class="badge">${statusLabel(task.status)}</span>
            <span class="badge priority-${task.priority}">${escapeHtml(task.priority)}</span>
            ${task.assignee ? `<span class="badge">Owner: ${escapeHtml(task.assignee)}</span>` : ''}
            ${task.dueDate ? `<span class="${overdue ? 'overdue' : ''}">${overdue ? 'Overdue · ' : ''}${formatDate(task.dueDate)}</span>` : ''}
          </div>
        </div>
        <div class="actions">
          ${task.status !== 'done' ? `<button class="button" data-action="complete" data-id="${task.id}">Complete</button>` : ''}
          <button class="button" data-action="assign" data-id="${task.id}">Assign</button>
          <button class="button danger" data-action="delete" data-id="${task.id}">Delete</button>
        </div>
      </article>
    `;
  }).join('');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function openModal(id) {
  $(id).classList.remove('hidden');
}

function closeModal(id) {
  $(id).classList.add('hidden');
}

$('#newTaskButton').addEventListener('click', () => {
  $('#taskForm').reset();
  $('#formError').textContent = '';
  openModal('#taskModal');
  $('#title').focus();
});

$('#closeModal').addEventListener('click', () => closeModal('#taskModal'));
$('#cancelButton').addEventListener('click', () => closeModal('#taskModal'));
$('#closeAssign').addEventListener('click', () => closeModal('#assignModal'));
$('#cancelAssign').addEventListener('click', () => closeModal('#assignModal'));

$('#taskForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('#formError').textContent = '';

  const dueDate = $('#dueDate').value
    ? new Date(`${$('#dueDate').value}T23:59:59.000Z`).toISOString()
    : null;

  try {
    await api('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: $('#title').value,
        description: $('#description').value,
        status: $('#status').value,
        priority: $('#priority').value,
        dueDate,
      }),
    });
    closeModal('#taskModal');
    await loadTasks();
  } catch (error) {
    $('#formError').textContent = error.message;
  }
});

$('#assignForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('#assignError').textContent = '';

  try {
    await api(`/tasks/${state.assignTaskId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignee: $('#assignee').value }),
    });
    closeModal('#assignModal');
    await loadTasks();
  } catch (error) {
    $('#assignError').textContent = error.message;
  }
});

$('#taskList').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const { action, id } = button.dataset;

  try {
    if (action === 'complete') {
      await api(`/tasks/${id}/complete`, { method: 'PATCH' });
    }

    if (action === 'delete') {
      if (!window.confirm('Delete this task?')) return;
      await api(`/tasks/${id}`, { method: 'DELETE' });
    }

    if (action === 'assign') {
      state.assignTaskId = id;
      $('#assignForm').reset();
      $('#assignError').textContent = '';
      openModal('#assignModal');
      $('#assignee').focus();
      return;
    }

    await loadTasks();
  } catch (error) {
    window.alert(error.message);
  }
});

document.querySelectorAll('.filter').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    state.status = button.dataset.status;
    render();
  });
});

$('#searchInput').addEventListener('input', (event) => {
  state.search = event.target.value.trim();
  render();
});

$('#sortSelect').addEventListener('change', (event) => {
  state.sort = event.target.value;
  render();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal('#taskModal');
    closeModal('#assignModal');
  }
});

loadTasks().catch((error) => {
  $('#emptyState').textContent = error.message;
  $('#emptyState').classList.remove('hidden');
});
