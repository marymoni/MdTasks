# Markdown Storage

Each active task is stored as one Markdown file in the configured active tasks folder.

Each task Markdown file must start with a fixed properties section surrounded by `---` lines.

```md
---
TaskDescription: Test Task One
JIRA: PLATFORM-1234
ETA: 2026-05-01
Status: 0 - WIP
Priority: 1 - High
Comments: Waiting for review
Responsible: Mary
---

Any additional Markdown content may appear here after the properties section.
```

The properties section must always be at the beginning of the file.

Any content after the closing `---` line is optional and may contain arbitrary Markdown text.

The server must:

- Read only `.md` files from the configured active tasks folder.
- Treat the file name without `.md` as the task `id`.
- Parse task properties from the section between the opening and closing `---` markers.
- Preserve the fixed property order when writing task files.
- Preserve arbitrary Markdown content after the closing `---` when updating task properties.

Archived tasks are Markdown files moved from the active tasks folder to the archive folder.
