const express = require('express');
const store = require('../db/store');

const router = express.Router();

function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

// GET /users — list all users.
router.get('/', (req, res) => {
  res.json(store.listUsers());
});

// GET /users/:id — fetch one user, or 404 if it doesn't exist.
router.get('/:id', (req, res) => {
  const user = store.getUser(Number(req.params.id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json(user);
});

// POST /users — create a user. Requires name and email.
router.post('/', (req, res) => {
  const { name, email } = req.body;
  if (!isNonEmptyString(name) || !isNonEmptyString(email)) {
    return res
      .status(400)
      .json({ error: 'name and email are required non-empty strings' });
  }
  const user = store.createUser({ name, email });
  return res.status(201).json(user);
});

// PUT /users/:id — update an existing user.
router.put('/:id', (req, res) => {
  const { name, email } = req.body;
  if (name === undefined && email === undefined) {
    return res.status(400).json({ error: 'name or email is required' });
  }
  if (
    (name !== undefined && !isNonEmptyString(name)) ||
    (email !== undefined && !isNonEmptyString(email))
  ) {
    return res.status(400).json({ error: 'name and email must be non-empty strings' });
  }
  const user = store.updateUser(Number(req.params.id), { name, email });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json(user);
});

module.exports = router;
