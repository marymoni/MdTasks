# API

Base URL:

```text
http://127.0.0.1:3001
```

Mutating API requests must include an `Origin` header matching one of:

- `http://127.0.0.1:5173`
- `http://127.0.0.1:3001`
- `http://127.0.0.1:3002`

The server generates a strong random API token on startup and injects it into the served client HTML. Mutating API requests must send that token in the `Authorization` header:

```text
Authorization: Bearer <startup-generated-token>
```

The client must keep the token in memory only.

## `GET /api/tasks`

Returns all parsed active tasks.

The server sorts returned tasks by `Status` in ascending A-to-Z string order.

Response:

```json
{
  "tasks": [
    {
      "id": "task-one",
      "TaskDescription": "Test Task One",
      "JIRA": "PLATFORM-1234",
      "ETA": "2026-05-01",
      "Status": "0 - WIP",
      "Priority": "1 - High",
      "Comments": "Waiting for review",
      "Responsible": "Mary",
      "updatedAt": 1778360204741.7654
    }
  ]
}
```

## `POST /api/tasks`

Creates a new task file with default values and a short UUID file name.

Response status: `201`

Response:

```json
{
  "task": {
    "id": "4767c865",
    "TaskDescription": "New Task",
    "JIRA": "JIRA-0000",
    "ETA": "",
    "Status": "0 - WIP",
    "Priority": "4 - Low",
    "Comments": "",
    "Responsible": ""
  }
}
```

## `PUT /api/tasks/:id`

Updates an existing task file.

The server must update the properties section and preserve any arbitrary Markdown content after the closing `---`.

Request body:

```json
{
  "TaskDescription": "Updated task",
  "JIRA": "PLATFORM-1234",
  "ETA": "2026-05-10",
  "Status": "1 - Pending",
  "Priority": "1 - High",
  "Comments": "Needs QA",
  "Responsible": "Alex"
}
```

Response:

```json
{
  "task": {
    "id": "task-one",
    "TaskDescription": "Updated task",
    "JIRA": "PLATFORM-1234",
    "ETA": "2026-05-10",
    "Status": "1 - Pending",
    "Priority": "1 - High",
    "Comments": "Needs QA",
    "Responsible": "Alex"
  }
}
```

## `DELETE /api/tasks/:id`

Deletes the task Markdown file for the provided task id.

Response status: `204`

No response body is returned.

## `POST /api/tasks/:id/archive`

Archives the task Markdown file for the provided task id.

The server must move the file from `TASKS_DIR` to `ARCHIVE_DIR`.

Response:

```json
{
  "archived": true
}
```

## Error Responses

API errors return JSON:

```json
{
  "error": "Generic error message"
}
```

Detailed error messages must be logged by the server and must not be returned to API clients.

Common status codes:

| Status | Meaning |
| --- | --- |
| `400` | Invalid task id or validation failure |
| `403` | Request origin is not allowed or API token is invalid |
| `404` | Task file not found |
| `409` | Archived task already exists |
| `500` | Unexpected server error |
