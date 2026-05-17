# Archive Requirements

The active tasks folder and archive folder are separate folders.

Archiving a task means moving the task Markdown file from the active tasks folder to the archive folder.

When the user clicks `Archive`:

- The client must call the archive API method for the selected task.
- The server must move the task Markdown file from the active tasks folder to the archive folder.
- The table must be reloaded after the archive API call succeeds.

Archived tasks must no longer appear in the active tasks table after the table reloads.
