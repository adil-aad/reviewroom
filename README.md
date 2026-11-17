# ReviewRoom

**Give good work a clear next step.**

[Live demo](https://reviewroom-opal.vercel.app) · [Projects API](https://reviewroom-api.vercel.app/projects)

[![Build web and API](https://github.com/adil-aad/reviewroom/actions/workflows/ci.yml/badge.svg)](https://github.com/adil-aad/reviewroom/actions/workflows/ci.yml)

A client feedback and approval portal for freelancers and small studios.
Keep projects, client feedback, and approval decisions in one place.

![ReviewRoom homepage](docs/images/reviewroom-home.png)

## Features

- Create projects with a client, description, and dedicated review page.
- Move work from **Awaiting feedback** to **Approved**.
- Collect project-specific feedback with author names and timestamps.
- Filter projects through a shareable URL.
- Get clear form validation, saving states, and error recovery.

## Stack

Next.js 16 · React 19 · TypeScript · NestJS 12 · Neon PostgreSQL · Vercel

## Current architecture

Next.js handles the web app and database operations. The NestJS API independently
exposes project reads from the same database. Connecting the web app to that API
is the next development milestone.

The public demo uses a separate database with sample data. Authentication and
project access permissions are planned.

Detailed development notes are in the [learning guide](docs/LEARNING.md).
