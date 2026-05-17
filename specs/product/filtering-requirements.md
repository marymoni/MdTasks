# Filtering Requirements

Filtering must be disabled by default.

Filtering must happen solely on the client side.

Filtering must not:

- Require an API request after the task list has already loaded.
- Change task files on disk.

## Text Filters

The following columns must have text filters:

- `TaskDescription`
- `Comments`
- `Responsible`

Each text-filtered column header must include a filter icon.

When the user clicks the filter icon, a text field for the filter value must appear.

When the user enters a filter value and presses Enter, the table must show only rows where the column value contains the filter value.

Text matching must be case-insensitive.

## Status Filter

The `Status` column header must include a filter icon.

When the user clicks the filter icon, a multi-select control must appear.

The multi-select options must be:

- `0 - WIP`
- `1 - Pending`
- `3 - Done`

The user must be able to select any combination of status values.

When the filter is activated, the table must show only rows where `Status` is in the selected status values.

## Priority Filter

The `Priority` column header must include a filter icon.

When the user clicks the filter icon, a multi-select control must appear.

The multi-select options must be:

- `0 - Critical`
- `1 - High`
- `3 - Medium`
- `4 - Low`

The user must be able to select any combination of priority values.

When the filter is activated, the table must show only rows where `Priority` is in the selected priority values.
