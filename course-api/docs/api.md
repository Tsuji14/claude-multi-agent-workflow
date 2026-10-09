# API reference

Base URL: `http://localhost:3000`

All request and response bodies are JSON. Errors come back as `{ "error": "message" }`; a malformed JSON request body returns `400`.

## Health

### GET /health
Returns the service status.

Response `200`:
```json
{ "status": "ok", "uptime": 12.34 }
```

## Users

A user looks like:
```json
{ "id": 1, "name": "Ada Lovelace", "email": "ada@example.com" }
```

### GET /users
Returns an array of all users.

### GET /users/:id
Returns a single user, or `404` if no user has that id.

### POST /users
Creates a user. Body requires `name` and `email` as non-empty strings; returns `201` with the created user, or `400` if either field is missing or not a string.

### PUT /users/:id
Updates an existing user. Body may include `name`, `email`, or both, as non-empty strings. Returns the updated user, `400` if neither field is given or a given field is not a non-empty string, or `404` if the user does not exist.
