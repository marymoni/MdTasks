import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const STATUS_VALUES = ['0 - WIP', '1 - Pending', '3 - Done'];
const PRIORITY_VALUES = ['0 - Critical', '1 - High', '3 - Medium', '4 - Low'];
const TASK_FIELDS = ['TaskDescription', 'JIRA', 'ETA', 'Status', 'Priority', 'Comments', 'Responsible'];
const SORTABLE_COLUMNS = ['ID', 'TaskDescription', 'JIRA', 'ETA', 'Status', 'Priority', 'Comments', 'Responsible'];
const TEXT_FILTER_COLUMNS = ['TaskDescription', 'Comments', 'Responsible'];
const FILTERABLE_COLUMNS = [...TEXT_FILTER_COLUMNS, 'Status', 'Priority'];
const COLUMN_WIDTHS = {
  ID: '7%',
  TaskDescription: '18%',
  JIRA: '11%',
  ETA: '8%',
  Status: '8%',
  Priority: '8%',
  Comments: '15%',
  Responsible: '15%',
  Actions: '10%',
};
const JIRA_BASE_URL = 'https://jira.com/';
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const TASK_FIELD_MAX_LENGTH = 255;
const LINE_BREAK_PATTERN = /[\r\n]/g;
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
let apiToken = String(window.__MY_TASK_VIEWER_API_TOKEN__ ?? '');
delete window.__MY_TASK_VIEWER_API_TOKEN__;

function compareTaskValues(firstTask, secondTask, column, direction) {
  const firstValue = String(firstTask[column] ?? '');
  const secondValue = String(secondTask[column] ?? '');
  const result = firstValue.localeCompare(secondValue, undefined, {
    numeric: true,
    sensitivity: 'base',
  });

  return direction === 'ascending' ? result : -result;
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseLocalDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function getStatusColorClass(status) {
  if (status === '3 - Done') {
    return 'field-success';
  }

  if (status === '0 - WIP') {
    return 'field-warning';
  }

  return '';
}

function getEtaColorClass(eta) {
  const etaDate = parseLocalDate(eta);
  if (!etaDate) {
    return '';
  }

  const today = startOfLocalDay(new Date());
  const etaTime = etaDate.getTime();
  const todayTime = today.getTime();
  const nextThreeDaysTime = todayTime + 3 * DAY_IN_MS;

  if (etaTime < todayTime) {
    return 'field-danger';
  }

  if (etaTime <= nextThreeDaysTime) {
    return 'field-warning';
  }

  return '';
}

function getJiraUrl(jiraValue) {
  return `${JIRA_BASE_URL}${String(jiraValue ?? '').trim()}`;
}

function cleanTaskFieldValue(value) {
  return String(value ?? '').replace(LINE_BREAK_PATTERN, '').slice(0, TASK_FIELD_MAX_LENGTH);
}

function cleanTaskForSave(task) {
  const cleanedTask = { ...task };
  for (const field of TASK_FIELDS) {
    cleanedTask[field] = cleanTaskFieldValue(cleanedTask[field]);
  }

  return cleanedTask;
}

function getApiToken() {
  if (apiToken) {
    return apiToken;
  }

  throw new Error('API token is missing');
}

function FilterIcon() {
  return (
    <svg className="filter-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M2 3h12L9.5 8.2V13l-3 1V8.2L2 3Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="link-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M6.7 10.6 5.3 12a2.5 2.5 0 0 1-3.5-3.5l2.1-2.1a2.5 2.5 0 0 1 3.5 0l.4.4" />
      <path d="m6.3 9.7 3.4-3.4" />
      <path d="m9.3 5.4 1.4-1.4a2.5 2.5 0 0 1 3.5 3.5l-2.1 2.1a2.5 2.5 0 0 1-3.5 0l-.4-.4" />
    </svg>
  );
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState(new Set());
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState(null);
  const [filters, setFilters] = useState({
    TaskDescription: '',
    Comments: '',
    Responsible: '',
    Status: [],
    Priority: [],
  });
  const [openFilter, setOpenFilter] = useState(null);
  const [draftTextFilters, setDraftTextFilters] = useState({
    TaskDescription: '',
    Comments: '',
    Responsible: '',
  });
  const [draftMultiSelectFilters, setDraftMultiSelectFilters] = useState({
    Status: [],
    Priority: [],
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const taskStats = useMemo(
    () => ({
      total: tasks.length,
      wip: tasks.filter((task) => task.Status === '0 - WIP').length,
      pending: tasks.filter((task) => task.Status === '1 - Pending').length,
      done: tasks.filter((task) => task.Status === '3 - Done').length,
    }),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      for (const column of TEXT_FILTER_COLUMNS) {
        const filterValue = filters[column].trim().toLocaleLowerCase();
        if (filterValue && !String(task[column] ?? '').toLocaleLowerCase().includes(filterValue)) {
          return false;
        }
      }

      if (filters.Status.length > 0 && !filters.Status.includes(task.Status)) {
        return false;
      }

      if (filters.Priority.length > 0 && !filters.Priority.includes(task.Priority)) {
        return false;
      }

      return true;
    });
  }, [filters, tasks]);

  const sortedTasks = useMemo(() => {
    if (!sortConfig) {
      return filteredTasks;
    }

    return filteredTasks
      .map((task, index) => ({ task, index }))
      .sort((first, second) => {
        const result = compareTaskValues(first.task, second.task, sortConfig.column, sortConfig.direction);
        return result || first.index - second.index;
      })
      .map(({ task }) => task);
  }, [filteredTasks, sortConfig]);

  function toggleSort(column) {
    setSortConfig((currentSort) => {
      if (currentSort?.column === column && currentSort.direction === 'ascending') {
        return { column, direction: 'descending' };
      }

      return { column, direction: 'ascending' };
    });
  }

  function getSortLabel(column) {
    if (sortConfig?.column !== column) {
      return '';
    }

    return sortConfig.direction === 'ascending' ? 'A-Z' : 'Z-A';
  }

  function getAriaSort(column) {
    if (sortConfig?.column !== column) {
      return 'none';
    }

    return sortConfig.direction;
  }

  function isFilterActive(column) {
    if (TEXT_FILTER_COLUMNS.includes(column)) {
      return Boolean(filters[column].trim());
    }

    if (column === 'Status' || column === 'Priority') {
      return filters[column].length > 0;
    }

    return false;
  }

  function openFilterPanel(column) {
    setOpenFilter((currentFilter) => (currentFilter === column ? null : column));
    if (TEXT_FILTER_COLUMNS.includes(column)) {
      setDraftTextFilters((currentDrafts) => ({
        ...currentDrafts,
        [column]: filters[column],
      }));
    }

    if (column === 'Status' || column === 'Priority') {
      setDraftMultiSelectFilters((currentDrafts) => ({
        ...currentDrafts,
        [column]: filters[column],
      }));
    }
  }

  function applyTextFilter(column) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [column]: draftTextFilters[column].trim(),
    }));
    setOpenFilter(null);
  }

  function clearTextFilter(column) {
    setDraftTextFilters((currentDrafts) => ({
      ...currentDrafts,
      [column]: '',
    }));
    setFilters((currentFilters) => ({
      ...currentFilters,
      [column]: '',
    }));
  }

  function toggleDraftMultiSelectValue(column, value) {
    setDraftMultiSelectFilters((currentDrafts) => {
      const currentValues = currentDrafts[column];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((currentValue) => currentValue !== value)
        : [...currentValues, value];

      return {
        ...currentDrafts,
        [column]: nextValues,
      };
    });
  }

  function applyMultiSelectFilter(column) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [column]: draftMultiSelectFilters[column],
    }));
    setOpenFilter(null);
  }

  function clearMultiSelectFilter(column) {
    setDraftMultiSelectFilters((currentDrafts) => ({
      ...currentDrafts,
      [column]: [],
    }));
    setFilters((currentFilters) => ({
      ...currentFilters,
      [column]: [],
    }));
  }

  function renderFilterPanel(column) {
    if (openFilter !== column) {
      return null;
    }

    if (TEXT_FILTER_COLUMNS.includes(column)) {
      return (
        <div className="filter-panel">
          <input
            aria-label={`${column} filter value`}
            autoFocus
            className="filter-text"
            value={draftTextFilters[column]}
            onChange={(event) =>
              setDraftTextFilters((currentDrafts) => ({
                ...currentDrafts,
                [column]: event.target.value,
              }))
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                applyTextFilter(column);
              }
            }}
          />
          <div className="filter-actions">
            <button type="button" className="secondary-button" onClick={() => clearTextFilter(column)}>
              Clear
            </button>
          </div>
        </div>
      );
    }

    const values = column === 'Status' ? STATUS_VALUES : PRIORITY_VALUES;

    return (
      <div className="filter-panel">
        <div className="filter-options" role="group" aria-label={`${column} filter values`}>
          {values.map((value) => (
            <label key={value} className="filter-option">
              <input
                type="checkbox"
                checked={draftMultiSelectFilters[column].includes(value)}
                onChange={() => toggleDraftMultiSelectValue(column, value)}
              />
              <span>{value}</span>
            </label>
          ))}
        </div>
        <div className="filter-actions">
          <button type="button" className="secondary-button" onClick={() => clearMultiSelectFilter(column)}>
            Clear
          </button>
          <button type="button" onClick={() => applyMultiSelectFilter(column)}>
            Apply
          </button>
        </div>
      </div>
    );
  }

  async function requestJson(url, options = {}) {
    const method = String(options.method ?? 'GET').toUpperCase();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (MUTATING_METHODS.has(method)) {
      headers.Authorization = `Bearer ${getApiToken()}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async function loadTasks() {
    setLoading(true);
    setError('');
    try {
      const data = await requestJson('/api/tasks');
      setTasks(data.tasks);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function addTask() {
    setError('');
    try {
      const data = await requestJson('/api/tasks', { method: 'POST' });
      setTasks((currentTasks) => [data.task, ...currentTasks]);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteExistingTask(id) {
    setError('');
    try {
      await requestJson(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function archiveExistingTask(id) {
    setError('');
    try {
      await requestJson(`/api/tasks/${id}/archive`, { method: 'POST' });
      await loadTasks();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function updateLocalTask(id, property, value) {
    const nextValue = TASK_FIELDS.includes(property) ? cleanTaskFieldValue(value) : value;
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === id ? { ...task, [property]: nextValue } : task)),
    );
  }

  async function saveTask(task) {
    const cleanedTask = cleanTaskForSave(task);
    setError('');
    setSavingIds((currentIds) => new Set(currentIds).add(cleanedTask.id));
    try {
      const data = await requestJson(`/api/tasks/${cleanedTask.id}`, {
        method: 'PUT',
        body: JSON.stringify(cleanedTask),
      });
      setTasks((currentTasks) =>
        currentTasks.map((currentTask) => (currentTask.id === cleanedTask.id ? data.task : currentTask)),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(cleanedTask.id);
        return nextIds;
      });
    }
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>Tasks</h1>
      </header>

      <section className="stats-bar" aria-label="Task statistics">
        <span>
          <strong>Total #</strong> {taskStats.total}
        </span>
        <span>
          <strong>WIP #</strong> {taskStats.wip}
        </span>
        <span>
          <strong>Pending #</strong> {taskStats.pending}
        </span>
        <span>
          <strong>Done #</strong> {taskStats.done}
        </span>
      </section>

      {error ? <p className="message error">{error}</p> : null}
      {loading ? <p className="message">Loading tasks...</p> : null}

      <div className="table-wrap">
        <table>
          <colgroup>
            {SORTABLE_COLUMNS.map((column) => (
              <col key={column} style={{ width: COLUMN_WIDTHS[column] }} />
            ))}
            <col style={{ width: COLUMN_WIDTHS.Actions }} />
          </colgroup>
          <thead>
            <tr>
              {SORTABLE_COLUMNS.map((column) => (
                <th key={column} scope="col" aria-sort={getAriaSort(column)}>
                  <div className="column-header">
                    <button
                      type="button"
                      className="sort-button"
                      onClick={() => toggleSort(column)}
                      aria-label={`Sort by ${column}`}
                    >
                      <span>{column}</span>
                      {getSortLabel(column) ? <span className="sort-indicator">{getSortLabel(column)}</span> : null}
                    </button>
                    {FILTERABLE_COLUMNS.includes(column) ? (
                      <button
                        type="button"
                        className={`filter-button${isFilterActive(column) ? ' filter-button-active' : ''}`}
                        onClick={() => openFilterPanel(column)}
                        aria-label={`Filter by ${column}`}
                        aria-expanded={openFilter === column}
                      >
                        <FilterIcon />
                      </button>
                    ) : null}
                  </div>
                  {renderFilterPanel(column)}
                </th>
              ))}
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task) => (
              <tr key={task.id}>
                <td className="task-id-cell">{task.id}</td>
                <td>
                  <input
                    aria-label="TaskDescription"
                    maxLength={TASK_FIELD_MAX_LENGTH}
                    value={task.TaskDescription}
                    onChange={(event) => updateLocalTask(task.id, 'TaskDescription', event.target.value)}
                    onBlur={() => saveTask(task)}
                  />
                </td>
                <td>
                  <div className="jira-cell">
                    <input
                      aria-label="JIRA"
                      maxLength={TASK_FIELD_MAX_LENGTH}
                      value={task.JIRA}
                      onChange={(event) => updateLocalTask(task.id, 'JIRA', event.target.value)}
                      onBlur={() => saveTask(task)}
                    />
                    <a
                      aria-label={`Open JIRA ${task.JIRA}`}
                      className="jira-link"
                      href={getJiraUrl(task.JIRA)}
                      rel="noreferrer"
                      target="_blank"
                      title={`Open ${getJiraUrl(task.JIRA)}`}
                    >
                      <LinkIcon />
                    </a>
                  </div>
                </td>
                <td>
                  <input
                    aria-label="ETA"
                    className={getEtaColorClass(task.ETA)}
                    maxLength={TASK_FIELD_MAX_LENGTH}
                    type="date"
                    value={task.ETA}
                    onChange={(event) => updateLocalTask(task.id, 'ETA', event.target.value)}
                    onBlur={() => saveTask(task)}
                  />
                </td>
                <td>
                  <select
                    aria-label="Status"
                    className={getStatusColorClass(task.Status)}
                    value={task.Status}
                    onChange={(event) => {
                      const nextTask = { ...task, Status: event.target.value };
                      updateLocalTask(task.id, 'Status', event.target.value);
                      saveTask(nextTask);
                    }}
                  >
                    {STATUS_VALUES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    aria-label="Priority"
                    value={task.Priority}
                    onChange={(event) => {
                      const nextTask = { ...task, Priority: event.target.value };
                      updateLocalTask(task.id, 'Priority', event.target.value);
                      saveTask(nextTask);
                    }}
                  >
                    {PRIORITY_VALUES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    aria-label="Comments"
                    maxLength={TASK_FIELD_MAX_LENGTH}
                    value={task.Comments}
                    onChange={(event) => updateLocalTask(task.id, 'Comments', event.target.value)}
                    onBlur={() => saveTask(task)}
                  />
                </td>
                <td>
                  <input
                    aria-label="Responsible"
                    maxLength={TASK_FIELD_MAX_LENGTH}
                    value={task.Responsible}
                    onChange={(event) => updateLocalTask(task.id, 'Responsible', event.target.value)}
                    onBlur={() => saveTask(task)}
                  />
                </td>
                <td className="actions">
                  <button type="button" className="archive-button" onClick={() => archiveExistingTask(task.id)}>
                    Archive
                  </button>
                  <button type="button" className="delete-button" onClick={() => deleteExistingTask(task.id)}>
                    Delete
                  </button>
                  {savingIds.has(task.id) ? <span>Saving...</span> : null}
                </td>
              </tr>
            ))}
            {!loading && sortedTasks.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty">
                  No tasks found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <button type="button" className="add-button" onClick={addTask}>
        Add Task
      </button>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
