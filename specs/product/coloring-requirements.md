# Coloring Requirements

The table must visually color selected task values.

## Status Coloring

- `3 - Done` values must have a green background color.
- `0 - WIP` values must have an amber background color.
- All other status values must use the regular background color.

## ETA Coloring

- ETA dates in the past must have a red background color.
- ETA dates within the next 3 days must have an amber background color.
- Empty ETA values and all other ETA dates must use the regular background color.

ETA coloring must be calculated relative to the user's current local date.

Coloring must happen on the client side only.
