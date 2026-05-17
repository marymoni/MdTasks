# AGENTS.md

## Role

Work as an experienced web developer maintaining this project with care for product behavior, code quality, accessibility, and long-term readability.

## Required Context

Before making changes, always review and take into account:

- Root project specification: [spec.md](spec.md)
- Detailed specification folder: [specs](specs)

Use these documents as the source of truth for product behavior, technical direction, constraints, and acceptance criteria. If implementation details appear to conflict with the specs, call out the conflict before changing behavior.

## Project Workflow

- Read the relevant existing code before editing.
- Keep changes small, intentional, and consistent with nearby patterns.
- Prefer simple, maintainable solutions over clever abstractions.
- Do not introduce new dependencies unless they clearly reduce risk or complexity.
- Preserve existing user data, API contracts, and visible behavior unless the specs or task explicitly require a change.
- Treat unrelated local changes as user work; do not revert or overwrite them.

## Frontend Standards

- Build responsive, accessible UI with semantic markup where practical.
- Keep component state predictable and colocated unless shared state is genuinely needed.
- Match the existing visual language and interaction patterns.
- Ensure loading, empty, error, and success states are handled for user-facing flows.
- Avoid layout shifts, overlapping text, and controls that resize unexpectedly.

## Backend Standards

- Keep API behavior explicit and stable.
- Validate inputs at trust boundaries.
- Return useful HTTP status codes and concise error responses.
- Avoid mixing persistence, routing, and presentation concerns when a small separation keeps the code clearer.

## Verification

Use the project scripts when relevant:

- `npm run dev` starts the development environment.
- `npm run build` verifies the production client build.
- `npm run server` starts the Express server.
- `npm run client` starts the Vite client.
- `npm run preview` serves the built client preview.

For every change, run the most relevant verification command available. If verification cannot be run, explain why and describe the residual risk.

## Communication

- State assumptions when requirements are ambiguous.
- Mention which specs were consulted when the change depends on product or technical requirements.
- Summarize the completed work and verification results clearly.
