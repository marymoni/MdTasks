# Architecture

My Task Viewer is a local web application with:

- A Node.js server using Express.
- A React client built with Vite.
- Markdown files as the persistence layer.

The server exposes HTTP API endpoints for task operations.

The client renders a single-page task table and performs client-side sorting, filtering, coloring, and statistics.

The server serves the built client from `dist/` and exposes API routes under `/api`.

On startup, the server generates a random API token, injects it into served client HTML, and requires it on mutating API routes.

The client must use standard HTML controls, including:

- `table`
- `button`
- `input`
- `select`
