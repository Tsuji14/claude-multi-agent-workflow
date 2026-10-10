const express = require('express');
const usersRouter = require('./routes/users');
const healthRouter = require('./routes/health');

const app = express();
app.use(express.json());

app.use('/health', healthRouter);
app.use('/users', usersRouter);

// Unknown routes get a JSON 404 instead of Express's default HTML page.
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Keep error responses in the documented `{ "error": "message" }` shape,
// including body-parser failures such as malformed JSON.
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  // Only trust error statuses that are valid 4xx/5xx codes.
  const candidate = err.status || err.statusCode;
  const status =
    Number.isInteger(candidate) && candidate >= 400 && candidate <= 599
      ? candidate
      : 500;
  if (status >= 500) {
    console.error(err);
  }
  return res
    .status(status)
    .json({ error: status >= 500 ? 'Internal server error' : err.message });
});

const PORT = process.env.PORT || 3000;

// Only start listening when run directly (e.g. `npm run dev`), so the tests
// can import the app without opening a port.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
