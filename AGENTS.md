<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Learning workflow

- Build ReviewRoom in small working milestones and explain new Next.js concepts
  using the actual project code. The user is comfortable with React.
- Keep components simple for learning, using direct props and local state when
  appropriate. Introduce abstractions as the lessons need them.
- Add NestJS later, once the Next.js foundations and backend responsibilities
  are clear.
- Make a focused local Git commit after each completed, validated milestone.
  Use the configured Git identity and include the commit in the progress report.
