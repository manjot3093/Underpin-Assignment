const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => taskService._reset());

  test('creates a task with defaults', () => {
    const task = taskService.create({ title: 'Read tests' });

    expect(task.title).toBe('Read tests');
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');
    expect(task.assignee).toBeNull();
    expect(task.completedAt).toBeNull();
    expect(task.id).toEqual(expect.any(String));
  });

  test('filters tasks by exact status', () => {
    taskService.create({ title: 'One', status: 'todo' });
    taskService.create({ title: 'Two', status: 'in_progress' });
    taskService.create({ title: 'Three', status: 'todo' });

    expect(taskService.getByStatus('todo')).toHaveLength(2);
  });

  test('returns the correct page without skipping the first page', () => {
    ['One', 'Two', 'Three'].forEach((title) => taskService.create({ title }));

    expect(taskService.getPaginated(1, 2).map((task) => task.title))
      .toEqual(['One', 'Two']);
    expect(taskService.getPaginated(2, 2).map((task) => task.title))
      .toEqual(['Three']);
  });

  test('updates and removes a task', () => {
    const task = taskService.create({ title: 'Old title' });

    expect(taskService.update(task.id, { title: 'New title' }).title)
      .toBe('New title');
    expect(taskService.remove(task.id)).toBe(true);
    expect(taskService.findById(task.id)).toBeUndefined();
  });

  test('completing a task sets status and completion time without changing priority', () => {
    const task = taskService.create({ title: 'Important', priority: 'high' });

    const completed = taskService.completeTask(task.id);

    expect(completed.status).toBe('done');
    expect(completed.priority).toBe('high');
    expect(completed.completedAt).toEqual(expect.any(String));
  });

  test('assigns a task to a user', () => {
    const task = taskService.create({ title: 'Review PR' });

    expect(taskService.assignTask(task.id, '  Manjot  ').assignee).toBe('Manjot');
  });

  test('returns null for operations on an unknown task', () => {
    expect(taskService.update('missing', { title: 'x' })).toBeNull();
    expect(taskService.completeTask('missing')).toBeNull();
    expect(taskService.assignTask('missing', 'Alex')).toBeNull();
    expect(taskService.remove('missing')).toBe(false);
  });

  test('calculates status and overdue counts', () => {
    taskService.create({
      title: 'Overdue',
      dueDate: '2020-01-01T00:00:00.000Z',
    });
    taskService.create({ title: 'In progress', status: 'in_progress' });
    taskService.create({ title: 'Done', status: 'done' });

    expect(taskService.getStats()).toEqual({
      todo: 1,
      in_progress: 1,
      done: 1,
      overdue: 1,
    });
  });
});
