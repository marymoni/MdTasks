# My Task Viewer Specification

My Task Viewer is a local web application for viewing, adding, editing, deleting, and archiving tasks.

The application has one page. On page load, it reads the configured active tasks folder and renders all active task Markdown files in a table.

Users must be able to:

- View active tasks in a table.
- Edit task property values directly in the table.
- Add a new task.
- Delete an active task.
- Archive an active task.
- Open a JIRA link for each task.
- Sort and filter task rows on the client side.
- See client-side task statistics.

Tasks are stored as Markdown files in a local folder. Archived tasks are moved to a separate archive folder.

The detailed specification is split into focused documents under `specs/`.

## Product Specifications

- [Task Model](specs/product/task-model.md)
- [Table Requirements](specs/product/table-requirements.md)
- [Sorting Requirements](specs/product/sorting-requirements.md)
- [Filtering Requirements](specs/product/filtering-requirements.md)
- [Coloring Requirements](specs/product/coloring-requirements.md)
- [Task Statistics Requirements](specs/product/task-statistics-requirements.md)
- [Archive Requirements](specs/product/archive-requirements.md)

## Technical Specifications

- [Architecture](specs/technical/architecture.md)
- [API](specs/technical/api.md)
- [Markdown Storage](specs/technical/markdown-storage.md)
- [Configuration](specs/technical/configuration.md)
- [Validation](specs/technical/validation.md)
