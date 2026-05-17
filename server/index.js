import express from 'express';
import { randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { archiveTask, createTask, deleteTask, getArchiveDir, getTasksDir, listTasks, updateTask } from './taskStore.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');
const allowedOrigins = new Set(['http://127.0.0.1:5173', 'http://127.0.0.1:3001', 'http://127.0.0.1:3002']);
const apiToken = randomBytes(32).toString('base64url');

function getErrorStatus(error) {
  if (Number.isInteger(error.status) && error.status >= 400 && error.status < 600) {
    return error.status;
  }

  if (Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode < 600) {
    return error.statusCode;
  }

  if (error.code === 'ENOENT') {
    return 404;
  }

  return 500;
}

function getClientErrorMessage(status) {
  if (status === 400) {
    return 'Invalid request';
  }

  if (status === 404) {
    return 'Resource not found';
  }

  if (status === 403) {
    return 'Forbidden';
  }

  if (status === 409) {
    return 'Request conflict';
  }

  return 'Unexpected server error';
}

function logError(error, request, status) {
  console.error('Request failed', {
    status,
    method: request.method,
    path: request.originalUrl,
    code: error.code,
    message: error.message,
    stack: error.stack,
  });
}

function setNoStore(response) {
  response.set('Cache-Control', 'no-store');
}

function injectApiToken(html) {
  const tokenScript = `<script>window.__MY_TASK_VIEWER_API_TOKEN__=${JSON.stringify(apiToken)};</script>`;
  if (html.includes('</head>')) {
    return html.replace('</head>', `${tokenScript}</head>`);
  }

  return `${tokenScript}${html}`;
}

function requireAllowedOrigin(request, _response, next) {
  const origin = request.get('Origin');
  if (allowedOrigins.has(origin)) {
    next();
    return;
  }

  const error = new Error('Request origin is not allowed');
  error.status = 403;
  next(error);
}

function requireApiToken(request, _response, next) {
  const authorization = request.get('Authorization');
  if (authorization === `Bearer ${apiToken}`) {
    next();
    return;
  }

  const error = new Error('Invalid API token');
  error.status = 403;
  next(error);
}

async function serveClientIndex(_request, response, next) {
  try {
    setNoStore(response);
    const indexHtml = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
    response.type('html').send(injectApiToken(indexHtml));
  } catch (error) {
    next(error);
  }
}

app.use(express.json());

app.get('/api/tasks', async (_request, response, next) => {
  try {
    response.json({ tasks: await listTasks() });
  } catch (error) {
    next(error);
  }
});

app.post('/api/tasks', requireAllowedOrigin, requireApiToken, async (_request, response, next) => {
  try {
    response.status(201).json({ task: await createTask() });
  } catch (error) {
    next(error);
  }
});

app.put('/api/tasks/:id', requireAllowedOrigin, requireApiToken, async (request, response, next) => {
  try {
    response.json({ task: await updateTask(request.params.id, request.body) });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/tasks/:id', requireAllowedOrigin, requireApiToken, async (request, response, next) => {
  try {
    await deleteTask(request.params.id);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post('/api/tasks/:id/archive', requireAllowedOrigin, requireApiToken, async (request, response, next) => {
  try {
    await archiveTask(request.params.id);
    response.json({ archived: true });
  } catch (error) {
    next(error);
  }
});

app.use('/api', (_request, response) => {
  response.status(404).json({ error: getClientErrorMessage(404) });
});

app.get(['/', '/index.html'], serveClientIndex);
app.use(express.static(distDir, { index: false }));
app.get('*', serveClientIndex);

app.use((error, request, response, _next) => {
  const status = getErrorStatus(error);
  logError(error, request, status);
  response.status(status).json({ error: getClientErrorMessage(status) });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Task API running on http://127.0.0.1:${port}`);
  console.log(`Using tasks folder: ${getTasksDir()}`);
  console.log(`Using archive folder: ${getArchiveDir()}`);
});
