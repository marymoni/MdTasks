# Validation

The server must validate task data when updating a task.

Validation rules:

- All task property values must be 255 characters or fewer.
- Task property values must not contain carriage return or line feed characters.
- `TaskDescription` must be a non-empty string.
- `JIRA` must be a non-empty string.
- `ETA` must be empty or match `YYYY-MM-DD`.
- `Status` must be one of the supported status values.
- `Priority` must be one of the supported priority values.
- `Comments` may be empty or any string.
- `Responsible` may be empty or any string.

Supported status values:

- `0 - WIP`
- `1 - Pending`
- `3 - Done`

Supported priority values:

- `0 - Critical`
- `1 - High`
- `3 - Medium`
- `4 - Low`

Validation failures must return HTTP `400`.
