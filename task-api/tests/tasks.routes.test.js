const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Task API routes', () => {
  beforeEach(() => taskService._reset());

  test('GET /tasks returns all tasks', async () => {
    await request(app).post('/tasks').send({ title: 'First' });

    const response = await request(app).get('/tasks');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('First');
  });

  test('GET /tasks filters by status', async () => {
    await request(app).post('/tasks').send({ title: 'Todo' });
    await request(app).post('/tasks').send({
      title: 'Working',
      status: 'in_progress',
    });

    const response = await request(app).get('/tasks?status=in_progress');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].status).toBe('in_progress');
  });

  test('GET /tasks paginates from page 1', async () => {
    for (const title of ['One', 'Two', 'Three']) {
      await request(app).post('/tasks').send({ title });
    }

    const response = await request(app).get('/tasks?page=1&limit=2');

    expect(response.status).toBe(200);
    expect(response.body.map((task) => task.title)).toEqual(['One', 'Two']);
  });

  test('GET /tasks/stats returns task counts', async () => {
    await request(app).post('/tasks').send({ title: 'One' });
    await request(app).post('/tasks').send({ title: 'Two', status: 'done' });

    const response = await request(app).get('/tasks/stats');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      todo: 1,
      in_progress: 0,
      done: 1,
      overdue: 0,
    });
  });

  test('POST /tasks creates a task', async () => {
    const response = await request(app)
      .post('/tasks')
      .send({ title: 'Build feature', priority: 'high' });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Build feature');
    expect(response.body.priority).toBe('high');
  });

  test('POST /tasks rejects an empty title', async () => {
    const response = await request(app)
      .post('/tasks')
      .send({ title: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/title is required/);
  });

  test('PUT /tasks/:id updates a task', async () => {
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Old title' });

    const response = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({ title: 'New title', priority: 'low' });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('New title');
    expect(response.body.priority).toBe('low');
  });

  test('PUT /tasks/:id returns 404 for an unknown task', async () => {
    const response = await request(app)
      .put('/tasks/not-found')
      .send({ title: 'New title' });

    expect(response.status).toBe(404);
  });

  test('DELETE /tasks/:id deletes a task', async () => {
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Delete me' });

    const response = await request(app).delete(`/tasks/${created.body.id}`);

    expect(response.status).toBe(204);
    expect((await request(app).get('/tasks')).body).toHaveLength(0);
  });

  test('DELETE /tasks/:id returns 404 when missing', async () => {
    const response = await request(app).delete('/tasks/not-found');

    expect(response.status).toBe(404);
  });

  test('PATCH /tasks/:id/complete completes a task', async () => {
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Finish this', priority: 'high' });

    const response = await request(app)
      .patch(`/tasks/${created.body.id}/complete`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('done');
    expect(response.body.priority).toBe('high');
    expect(response.body.completedAt).toEqual(expect.any(String));
  });

  test('PATCH /tasks/:id/complete returns 404 when missing', async () => {
    const response = await request(app)
      .patch('/tasks/not-found/complete');

    expect(response.status).toBe(404);
  });

  test('PATCH /tasks/:id/assign assigns a user', async () => {
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Assign me' });

    const response = await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({ assignee: 'Priya' });

    expect(response.status).toBe(200);
    expect(response.body.assignee).toBe('Priya');
  });

  test('PATCH /tasks/:id/assign rejects an empty assignee', async () => {
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Assign me' });

    const response = await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({ assignee: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/assignee is required/);
  });

  test('PATCH /tasks/:id/assign returns 404 when task does not exist', async () => {
    const response = await request(app)
      .patch('/tasks/not-found/assign')
      .send({ assignee: 'Priya' });

    expect(response.status).toBe(404);
  });
});
