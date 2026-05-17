# Task Model

Each task is represented by a Markdown file. The file name without the `.md` extension is the task `ID`.

The `ID` is read-only in the web app.

## Properties

All property values must be 255 characters or fewer and must not contain carriage return or line feed characters.

| Property | Required | Description | Valid Values |
| --- | --- | --- | --- |
| `TaskDescription` | Yes | Short task description | Non-empty string |
| `JIRA` | Yes | JIRA ticket reference or link | Non-empty string |
| `ETA` | No | Task deadline | Empty string or date in `YYYY-MM-DD` format |
| `Status` | Yes | Task working status | `0 - WIP`, `1 - Pending`, `3 - Done` |
| `Priority` | Yes | Task priority | `0 - Critical`, `1 - High`, `3 - Medium`, `4 - Low` |
| `Comments` | No | Arbitrary comment for the task | Empty string or any string |
| `Responsible` | No | Person responsible for the task | Empty string or any person name string |

## Default Task Values

```json
{
  "TaskDescription": "New Task",
  "JIRA": "JIRA-0000",
  "ETA": "",
  "Status": "0 - WIP",
  "Priority": "4 - Low",
  "Comments": "",
  "Responsible": ""
}
```
