import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export const STATUS_VALUES = ['0 - WIP', '1 - Pending', '3 - Done'];
export const PRIORITY_VALUES = ['0 - Critical', '1 - High', '3 - Medium', '4 - Low'];

const PROPERTIES = ['TaskDescription', 'JIRA', 'ETA', 'Status', 'Priority', 'Comments', 'Responsible'];
const MAX_FIELD_LENGTH = 255;
const LINE_BREAK_PATTERN = /[\r\n]/;
const DEFAULT_TASK = {
  TaskDescription: 'New Task',
  JIRA: 'JIRA-0000',
  ETA: '',
  Status: '0 - WIP',
  Priority: '4 - Low',
  Comments: '',
  Responsible: '',
};

export function getTasksDir() {
  return process.env.TASKS_DIR || path.resolve(process.cwd(), 'tasks');
}

export function getArchiveDir() {
  return process.env.ARCHIVE_DIR || path.resolve(process.cwd(), 'tasks', 'archive');
}

function assertTaskId(id) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    const error = new Error('Invalid task id');
    error.status = 400;
    throw error;
  }
}

function taskPath(tasksDir, id) {
  assertTaskId(id);
  return path.join(tasksDir, `${id}.md`);
}

function parseMarkdownTask(id, content, stat) {
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');

  if (lines[0] !== '---') {
    throw new Error(`${id}.md does not start with front matter marker ${lines[0]}`);
  }

  const endIndex = lines.indexOf('---', 1);
  if (endIndex === -1) {
    throw new Error(`${id}.md does not close front matter marker`);
  }

  const task = { id };
  for (const line of lines.slice(1, endIndex)) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (PROPERTIES.includes(key)) {
      task[key] = value;
    }
  }

  for (const property of PROPERTIES) {
    task[property] ??= '';
  }

  task.updatedAt = stat.mtimeMs;
  return task;
}

function serializeTask(task) {
  return serializeTaskWithBody(task, '');
}

function serializeTaskWithBody(task, body) {
  return [
    '---',
    `TaskDescription: ${task.TaskDescription}`,
    `JIRA: ${task.JIRA}`,
    `ETA: ${task.ETA}`,
    `Status: ${task.Status}`,
    `Priority: ${task.Priority}`,
    `Comments: ${task.Comments}`,
    `Responsible: ${task.Responsible}`,
    '---',
    body,
  ].join('\n');
}

function getMarkdownBody(content) {
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');

  if (lines[0] !== '---') {
    return '';
  }

  const endIndex = lines.indexOf('---', 1);
  if (endIndex === -1) {
    return '';
  }

  return lines.slice(endIndex + 1).join('\n');
}

function validateTask(task) {
  const errors = [];

  if (!task.TaskDescription || !String(task.TaskDescription).trim()) {
    errors.push('TaskDescription is required');
  }

  if (!task.JIRA || !String(task.JIRA).trim()) {
    errors.push('JIRA is required');
  }

  if (task.ETA && !/^\d{4}-\d{2}-\d{2}$/.test(task.ETA)) {
    errors.push('ETA must be empty or formatted as YYYY-MM-DD');
  }

  if (!STATUS_VALUES.includes(task.Status)) {
    errors.push(`Status must be one of: ${STATUS_VALUES.join(', ')}`);
  }

  if (!PRIORITY_VALUES.includes(task.Priority)) {
    errors.push(`Priority must be one of: ${PRIORITY_VALUES.join(', ')}`);
  }

  if (errors.length > 0) {
    const error = new Error(errors.join('; '));
    error.status = 400;
    throw error;
  }
}

function validateTaskFieldShape(input) {
  const source = input ?? {};
  const errors = [];

  for (const property of PROPERTIES) {
    const value = String(source[property] ?? '');
    if (value.length > MAX_FIELD_LENGTH) {
      errors.push(`${property} must be ${MAX_FIELD_LENGTH} characters or fewer`);
    }

    if (LINE_BREAK_PATTERN.test(value)) {
      errors.push(`${property} must not contain line breaks`);
    }
  }

  if (errors.length > 0) {
    const error = new Error(errors.join('; '));
    error.status = 400;
    throw error;
  }
}

function cleanTask(input) {
  const source = input ?? {};

  return {
    TaskDescription: String(source.TaskDescription ?? '').trim(),
    JIRA: String(source.JIRA ?? '').trim(),
    ETA: String(source.ETA ?? '').trim(),
    Status: String(source.Status ?? '').trim(),
    Priority: String(source.Priority ?? '').trim(),
    Comments: String(source.Comments ?? '').trim(),
    Responsible: String(source.Responsible ?? '').trim(),
  };
}

async function createShortId(tasksDir) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = randomUUID().replaceAll('-', '').slice(0, 8);
    try {
      await fs.access(taskPath(tasksDir, id));
    } catch {
      return id;
    }
  }

  throw new Error('Could not create a unique task id');
}

export async function listTasks() {
  const tasksDir = getTasksDir();
  await fs.mkdir(tasksDir, { recursive: true });

  const entries = await fs.readdir(tasksDir, { withFileTypes: true });
  const tasks = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
      .map(async (entry) => {
        const id = path.basename(entry.name, '.md');
        const filePath = taskPath(tasksDir, id);
        const [content, stat] = await Promise.all([fs.readFile(filePath, 'utf8'), fs.stat(filePath)]);
        return parseMarkdownTask(id, content, stat);
      }),
  );

  return tasks.sort((a, b) => String(a.Status ?? '').localeCompare(String(b.Status ?? '')));
}

export async function createTask() {
  const tasksDir = getTasksDir();
  await fs.mkdir(tasksDir, { recursive: true });

  const id = await createShortId(tasksDir);
  const task = { id, ...DEFAULT_TASK };
  await fs.writeFile(taskPath(tasksDir, id), serializeTask(task), 'utf8');
  return task;
}

export async function updateTask(id, input) {
  const tasksDir = getTasksDir();
  validateTaskFieldShape(input);
  const task = cleanTask(input);
  validateTask(task);

  const filePath = taskPath(tasksDir, id);
  const existingContent = await fs.readFile(filePath, 'utf8');
  await fs.writeFile(filePath, serializeTaskWithBody(task, getMarkdownBody(existingContent)), 'utf8');
  return { id, ...task };
}

export async function deleteTask(id) {
  const tasksDir = getTasksDir();
  await fs.rm(taskPath(tasksDir, id));
}

export async function archiveTask(id) {
  const tasksDir = getTasksDir();
  const archiveDir = getArchiveDir();
  const sourcePath = taskPath(tasksDir, id);
  const destinationPath = taskPath(archiveDir, id);

  await fs.mkdir(archiveDir, { recursive: true });

  try {
    await fs.access(destinationPath);
    const error = new Error('Archived task already exists');
    error.status = 409;
    throw error;
  } catch (error) {
    if (error.status === 409) {
      throw error;
    }

    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  await fs.rename(sourcePath, destinationPath);
}
