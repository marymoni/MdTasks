# Sorting Requirements

The table must allow sorting by task columns.

Sortable columns:

- `ID`
- `TaskDescription`
- `JIRA`
- `ETA`
- `Status`
- `Priority`
- `Comments`
- `Responsible`

Each sortable column must support:

- Ascending order from A to Z.
- Descending order from Z to A.

Interactive table sorting must happen on the client side only.

Interactive sorting must not:

- Change the order of task files on disk.
- Require an API request after the task list has already loaded.
