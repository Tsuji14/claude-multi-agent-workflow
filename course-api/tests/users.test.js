const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../server');
const store = require('../db/store');

test.beforeEach(() => store.reset());

test('GET /users returns the seeded list', async () => {
  const res = await request(app).get('/users');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.equal(res.body.length, 2);
});

test('GET /users/:id returns 404 for a missing user', async () => {
  const res = await request(app).get('/users/999');
  assert.equal(res.status, 404);
});

test('POST /users creates a user', async () => {
  const res = await request(app)
    .post('/users')
    .send({ name: 'Grace Hopper', email: 'grace@example.com' });
  assert.equal(res.status, 201);
  assert.equal(res.body.name, 'Grace Hopper');
  assert.ok(res.body.id);
});

test('PUT /users/:id updates an existing user', async () => {
  const res = await request(app).put('/users/1').send({ name: 'Ada L.' });
  assert.equal(res.status, 200);
  assert.equal(res.body.name, 'Ada L.');
});

test('PUT /users/:id returns 404 for a missing user', async () => {
  const res = await request(app).put('/users/999').send({ name: 'Nobody' });
  assert.equal(res.status, 404);
});

test('POST /users returns 400 when name or email is not a string', async () => {
  const res = await request(app)
    .post('/users')
    .send({ name: 123, email: { a: 1 } });
  assert.equal(res.status, 400);
  assert.ok(res.body.error);
  assert.equal(store.listUsers().length, 2);
});

test('PUT /users/:id returns 400 and leaves the user unchanged for invalid values', async () => {
  for (const body of [{ name: null }, { name: '' }, { email: 42 }]) {
    const res = await request(app).put('/users/1').send(body);
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  }
  assert.deepEqual(store.getUser(1), {
    id: 1,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
  });
});

test('malformed JSON returns a 400 JSON error', async () => {
  const res = await request(app)
    .post('/users')
    .set('Content-Type', 'application/json')
    .send('{bad');
  assert.equal(res.status, 400);
  assert.match(res.headers['content-type'], /application\/json/);
  assert.equal(res.body.error, 'Malformed JSON body');
});

test('POST /users returns 400 when email is missing and creates no user', async () => {
  const res = await request(app).post('/users').send({ name: 'No Email' });
  assert.equal(res.status, 400);
  assert.ok(res.body.error);
  assert.equal(store.listUsers().length, 2);
});

test('PUT /users/:id returns 400 for an empty body', async () => {
  const res = await request(app).put('/users/1').send({});
  assert.equal(res.status, 400);
  assert.ok(res.body.error);
});

test('GET /users/:id returns the seeded user', async () => {
  const res = await request(app).get('/users/1');
  assert.equal(res.status, 200);
  assert.equal(res.body.id, 1);
  assert.equal(res.body.name, 'Ada Lovelace');
});

test('GET /health returns ok', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('unknown routes return a 404 JSON error', async () => {
  const res = await request(app).get('/nope');
  assert.equal(res.status, 404);
  assert.match(res.headers['content-type'], /application\/json/);
  assert.deepEqual(res.body, { error: 'Not found' });
});
