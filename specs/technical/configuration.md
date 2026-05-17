# Configuration

Runtime configuration is provided with environment variables.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `TASKS_DIR` | No | `./tasks` resolved from the server working directory | Folder where active task Markdown files are stored |
| `ARCHIVE_DIR` | No | `./tasks/archive` resolved from the server working directory | Folder where archived task Markdown files are moved |
| `PORT` | No | `3001` | HTTP server port |

The default active tasks folder is:

```text
C:\Users\marymoni\Documents\Git\learning\MyTaskViewer\tasks
```

The default archive folder is:

```text
C:\Users\marymoni\Documents\Git\learning\MyTaskViewer\tasks\archive
```
