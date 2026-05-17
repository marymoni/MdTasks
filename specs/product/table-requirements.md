# Table Requirements

The table must use standard HTML table elements.

The table must show these columns:

- `ID`
- `TaskDescription`
- `JIRA`
- `ETA`
- `Status`
- `Priority`
- `Comments`
- `Responsible`
- `Actions`

The `ID` column must show the task file name without the `.md` extension. It is read-only.

Each task row must show editable fields for task properties except `ID`.

Edited values must be saved back to the corresponding Markdown file.

The `JIRA` column cell must include a clickable Link icon. The link URL is:

```text
https://jira.com/ + JIRA value
```

Example:

```text
https://jira.com/PLATFORM-1234
```

The `Actions` column must include:

- `Archive` button.
- `Delete` button.

The page must include an `Add Task` button below the table.

When `Add Task` is clicked:

- A new task is created.
- A new Markdown file is written to the active tasks folder.
- The file name is a short UUID with the `.md` extension.
- The new task is inserted into the table.
