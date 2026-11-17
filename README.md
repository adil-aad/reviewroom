# ReviewRoom

A client feedback and approval portal we are building to learn Next.js, then
NestJS. You can create projects, update their status with Server Actions,
filter the project list with a shareable URL, and add feedback on individual
project pages. Two example projects are included. By default, saved projects and
feedback live in local JSON files; an optional Neon PostgreSQL connection stores
them in a database instead. Project routes include
loading feedback and a recovery screen for unexpected rendering errors.
The NestJS API in `backend/` has health and project read endpoints backed by
Neon. Next.js still performs its existing project and feedback operations
directly; the next lesson connects its pages to the API.

## Run locally

Use Node.js 20.9 or newer. In PowerShell:

```powershell
cd D:\reviewroom
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Next.js, normally http://localhost:3000.
Keep that terminal running while using the app. Ctrl+C stops the server.

## The files we are learning

```text
src/app/
  layout.tsx           Shared document structure and navigation
  globals.css          Shared page styles
  icon.svg             Browser tab icon, discovered by Next.js
  page.tsx             Homepage at /
  projects/
    page.tsx           Projects page at /projects
    loading.tsx        Loading fallback for project routes
    error.tsx          Unexpected rendering errors and a retry button
    ProjectList.tsx    Interactive list and status filter
    data.ts            Example projects and shared TypeScript types
    database.ts        Server-only Neon connection, when configured
    store.ts           Server-only project queries or local file storage
    feedback-store.ts  Server-only feedback queries or local file storage
    new/
      page.tsx         Create-project page at /projects/new
      NewProjectForm.tsx  Form, validation feedback, and pending state
      actions.ts       The createProject Server Action
    [id]/
      page.tsx         Project details at /projects/:id
      ProjectStatusForm.tsx  Status selector, pending state, and feedback
      FeedbackForm.tsx  Name and feedback fields with submission feedback
      actions.ts       Status-update and add-feedback Server Actions
      not-found.tsx    Message for an unknown project ID
```

`layout.tsx` receives the matching page as its `children` prop. The shared
navigation sits outside `{children}`, so it appears on both pages. The component
name does not determine the URL; the file location does.

Navigation uses `Link` from `next/link`. It links to another route and lets
Next.js handle navigation within the app. Our source page and layout files are
Server Components by default.

The earlier milestones describe the local JSON mode. Milestone 9 adds optional
database storage while keeping the same form and page components.

## Milestone 2: Server and Client Components

`projects/page.tsx` is a Server Component. It reads projects with `getProjects()`
and passes them into `<ProjectList projects={projects} />`. It now waits for a
request before reading the current local data, as described in milestone 4.

`ProjectList.tsx` starts with `"use client"`. That marks an entry point for
JavaScript that will run in the browser. It allows the component to use hooks
and handle the dropdown's `onChange` event. Importing this component does not
turn its parent page into a Client Component.

The `projects` array is sent to the client component as props. These props must
be serializable by React; our objects contain plain strings. A Server Component
can keep its own code on the server while still sending data to the browser.

In this milestone, the filter used one `useState` variable, `status`, and
calculated `visibleProjects` from the current props and selection. Changing
the selection updated the list in the browser without changing the original
array. Milestone 7 replaces that local state with a URL query parameter so
the selection can survive reloads and be shared.

Client Components can also be prerendered into the initial HTML on the server.
React then makes them interactive in the browser through **hydration**.
`"use client"` identifies the browser boundary; it does not disable initial
server rendering.

## Milestone 3: Dynamic routes

The folder `[id]` captures one part of the URL. Both of these URLs use
`projects/[id]/page.tsx`:

| URL | Captured `id` |
| --- | --- |
| `/projects/brand-identity` | `brand-identity` |
| `/projects/website-homepage` | `website-homepage` |

Next.js passes that value through the page's `params` prop. In this Next.js
version, `params` is a Promise, so the page is an `async` function and reads it
with `const { id } = await params`. It uses
`getProject(id)` to select the matching project and render its details. In local
mode, that helper uses `.find()`; in database mode, it queries that ID directly.

The detail page is a Server Component. Reading an ID from the URL does not
require `"use client"`. This page currently renders on demand; we will study
prerendering dynamic routes in a later lesson.

If the ID does not match a project, `notFound()` stops the page's rendering and
Next.js displays the nearby `not-found.tsx` component. That component provides a
link back to the project list.

The starter examples and shared types live in `projects/data.ts`. This is a
regular TypeScript module, not a URL. The client list uses `import type` to
share the `Project` type without importing the data module at runtime. The
list still receives its data through props.

## Milestone 4: Forms and Server Actions

`/projects/new` is a specific route, so it takes precedence over `/projects/[id]`.
Its page renders `NewProjectForm`, a Client Component with three native fields.
An input's `name` determines its key in the submitted `FormData`.

The form uses React's `useActionState(createProject, initialState)`, which returns:

- `state`: feedback and field values returned by the action.
- `formAction`: the function passed to `<form action={formAction}>`.
- `pending`: whether the action is running, used to disable the submit button.

`new/actions.ts` starts with `"use server"`. Its exported `createProject`
function runs on the server when the form is submitted. Next.js handles the
POST request between the browser and that function. `useActionState` supplies
the previous state as the first argument and the submitted `FormData` as the
second argument.

The action trims the submitted text and checks required fields and length
limits. The browser's `required` and `maxLength` attributes guide input; the
server enforces the same rules. Validation errors return a message and the
entered values so the user can correct the form.

On success, the action follows this sequence:

```text
saveProject(values)
  -> revalidatePath("/projects")
  -> redirect("/projects")
```

`revalidatePath` invalidates the projects route's cached UI/data.
`redirect` sends the user back to the list. It is outside the storage
`try/catch` because Next.js implements redirects with a control-flow exception.

The list page calls `await connection()` before reading projects. This tells
Next.js to wait for a request, so local data is read at request time instead of
being fixed into a prerendered page at build time.

### Local storage for this lesson

`store.ts` uses Node.js filesystem APIs and imports `server-only`, which keeps
it from being imported into a Client Component. `getProjects()` combines our
two starter examples with the saved projects. `saveProject()` assigns a UUID
and the initial status **Awaiting feedback** on the server.

Each new project is saved to its own JSON file under `.local-data/projects/`.
The store writes a temporary file and renames it after the write completes so
readers see complete JSON. Separate files keep concurrent creations from
overwriting one shared array.

Saved projects survive page reloads and server restarts. The `.local-data/`
directory is excluded from Git; our commits capture code rather than local
project records. This store needs a writable, persistent local disk. For
deployment, we will introduce a database and authentication in later lessons.

## Milestone 5: Updating a project

Each project detail page now renders `ProjectStatusForm` with the project's
ID and current status as props. The page remains a Server Component; only the
form needs `"use client"` for `useActionState` and its pending/error feedback.

The dropdown starts with `defaultValue={status}`. Its `key={status}` recreates
just the dropdown when the saved status changes, so React's automatic form
reset uses the new saved value. The status displayed above the form also comes
from the server. The form's `key` is the project ID, so a different project
starts with its own selection and feedback.

The form submits two fields: a hidden `projectId` and the selected `status`.
The hidden field includes the ID in `FormData` without showing another input.
It is still visible and editable in browser tools, so the server checks that
the project exists. The action also accepts only **Awaiting feedback** or
**Approved**, even if someone submits a different value outside the dropdown.

`ProjectStatus` is a TypeScript union of those two strings. It helps catch
mistakes in our code; the action's checks validate the actual submitted data.

`changeProjectStatus` calls `updateProjectStatus` in `store.ts`. The store
finds the project, creates `{ ...project, status }`, and writes it back to the
existing file. The ID and other fields stay the same. An unknown ID returns
`null`, which the action turns into a useful error message.

The two starter projects begin in `data.ts`. Their first update creates a
local saved copy with a stable filename, such as `sample-brand-identity.json`.
`getProjects()` uses that saved copy in place of the starter example, so it
appears once in the list and its new status survives a restart. Existing
timestamped project files continue to work.

Both creation and updates use the small `writeProject` helper. Each write
gets a unique temporary filename and renames it only after writing finishes.
If two status updates reach the same project, the last completed rename wins.

After saving, the action calls `revalidatePath` for both `/projects` and the
specific detail URL. This refreshes the displayed status and makes the list's
filter use the updated data. We return a success message and stay on the
detail page; this action does not need `redirect()`.

## Milestone 6: Loading and error boundaries

The project pages read data asynchronously on the server. Next.js can display
`projects/loading.tsx` while a project route is waiting to finish rendering,
then replace it with the completed page. This is **streaming**: the browser
can receive the layout and loading UI before the page content is ready.

Adding this special file makes Next.js place a React **Suspense boundary**
around the page and nested routes. We do not import `ProjectsLoading` into
either page or manage an `isLoading` state variable. It is a Server Component
by default, and `role="status"` marks its loading message for assistive
technology. Local file reads are fast and navigation may reuse prefetched
content, so this message will not necessarily be visible on every visit.

`projects/error.tsx` supplies the fallback for a React **error boundary**.
For example, if `getProjects()` cannot parse a saved JSON file, that exception
prevents the page from rendering. Next.js displays our recovery screen in
place of the failed content. The root layout's navigation remains available.
This boundary covers `/projects` and its nested routes; it does not catch
errors in a layout above it or errors thrown inside ordinary event handlers.

Error components must use `"use client"`. Next.js passes recovery functions
to the component as props, and our button calls `retry()`. In this installed
Next.js version, `retry()` fetches fresh server content and attempts to render
the route again. `reset()` only clears the boundary's error state and
re-renders its children without fetching fresh content. A retry can recover
after a temporary failure, but cannot repair a damaged file by itself.

We show a helpful message instead of displaying the raw exception. The server
logs retain the original error for debugging; production Server Component
errors sent to the browser have their details hidden by Next.js.

These mechanisms handle different situations:

| Situation in ReviewRoom | UI mechanism |
| --- | --- |
| A project page is still rendering | `loading.tsx` |
| A page throws an unexpected error | `error.tsx` |
| The requested project does not exist | `[id]/not-found.tsx`, reached through `notFound()` |
| Submitted form fields are invalid | An action returns feedback through `useActionState` |
| A form submission is running | The form's `pending` value from `useActionState` |

### Explore these states locally

For a loading experiment, temporarily add the following as the first line
inside `getProjects()` in `projects/store.ts` while running the development
server:

```ts
await new Promise((resolve) => setTimeout(resolve, 2000));
```

Reload `/projects` to see the loading message followed by the list. The shared
Home link remains available while the page loads. Remove the delay afterward.

For an error experiment, temporarily add `throw new Error("Lesson error")`
after `await connection()` in `projects/page.tsx`. Visit `/projects` to reach
the error boundary. Development mode also shows Next.js's debugging overlay;
dismiss it to see our fallback. Remove the throw afterward. Hot reload may
recover automatically when the source is corrected; in production, **Try
again** requests fresh content without requiring a full browser reload.

Visiting `/projects/missing-project` still shows **Project not found**, and
ordinary form validation still appears beside the form.

## Milestone 7: Keeping the filter in the URL

The status filter now reads its selection from the URL. For example, opening
`/projects?status=Approved` selects **Approved** and shows only approved
projects. Reloading or sharing that address preserves the selected view.

`[id]` in `/projects/[id]` is a **route parameter**: it identifies a project.
`status` after the `?` is a **query parameter**: it changes the view of the
same `/projects` page. A query parameter does not need another route folder.

| URL | Selected filter |
| --- | --- |
| `/projects` | All statuses |
| `/projects?status=Approved` | Approved |
| `/projects?status=Awaiting+feedback` | Awaiting feedback |
| `/projects?status=unknown` | All statuses |

### Reading the selection

`ProjectList.tsx` uses `useSearchParams()` from `next/navigation` to read the
current query parameters. Its `.get("status")` returns a string, or `null`
when the parameter is missing. It decodes URL encoding automatically, so
`Awaiting+feedback` becomes `Awaiting feedback`. For repeated `status`
parameters, `.get()` uses the first value.

The component accepts our two known statuses and treats anything else as
**All statuses**. An unsupported value stays in the address bar until the
user changes the filter, but does not leave the dropdown in an invalid state.
Both the dropdown's `value` and `visibleProjects` come from this validated
value. There is no separate `useState` value or effect to keep synchronized.

### Changing the selection

The hook returns read-only search parameters. In the `changeStatus` event
handler, we create a mutable `URL` from `window.location.href` and change its
`searchParams`. Selecting **All statuses** deletes `status`; another selection
sets it. Other query parameters and any `#fragment` are preserved.

The handler then calls:

```ts
window.history.pushState(null, "", url);
```

This is the browser's History API. Next.js integrates it with its router, so
`useSearchParams()` updates and React renders the matching projects. It adds
a history entry without reloading the document or requesting new project
data. Browser **Back** and **Forward** restore previous selections too.
`replaceState` would replace the current entry; we use `pushState` so each
filter change can be revisited.

The list still filters the projects already received through props. If we
later fetch a filtered subset from a database, the page can read its server
`searchParams` prop and use a Next.js navigation to request that data. Saving
a filter in the URL does not save or change any project's status.

`window` is only accessed inside the browser event handler. The component can
still render on the server initially: `projects/page.tsx` already calls
`await connection()`, so `useSearchParams` has the incoming request's query
parameters. Statically prerendered routes using this hook need a Suspense
boundary; our project route already renders at request time.

### Try the URL filter

1. Open `/projects`, choose **Approved**, and inspect `?status=Approved` in
   the address bar.
2. Reload or open that URL in another tab. The selection and filtered list
   are preserved.
3. Choose **Awaiting feedback**, then use the browser's **Back** and
   **Forward** buttons. Both the dropdown and visible projects follow the URL.
4. Choose **All statuses**. The `status` query parameter disappears.
5. Open `/projects?status=unknown`. All projects remain visible.
6. Open a project from a filtered list, then use browser **Back** to return
   to that filtered view. The page's **Back to projects** link deliberately
   points to the default `/projects` view.

## Milestone 8: Feedback attached to a project

Each project detail page now has a feedback form and a history, with the newest
entries first. A note contains the author's name, message, and a server-generated
ID and timestamp. Its `projectId` links it to the project it belongs to. This is
a **one-to-many relationship**: one project can have many feedback entries.

`FeedbackInput` in `projects/data.ts` describes the two user-entered fields.
`ProjectFeedback` combines those fields with the ID, project ID, and timestamp
added by the server. The TypeScript `&` combines the fields of both types.

### A server-rendered history beside an interactive form

The detail page first finds the project or calls `notFound()`. It then calls
`await getProjectFeedback(project.id)` and renders the returned entries with
`.map()`. That history stays in the Server Component; `FeedbackForm` is the
Client Component that needs `useActionState` for submission feedback.

The form receives only `projectId` as a prop. It does not receive or maintain
its own copy of the feedback history. The page renders timestamps in UTC with
an explicit label and a machine-readable `<time dateTime={entry.createdAt}>`.
Messages are ordinary JSX text, so HTML-like input appears as text. CSS
preserves line breaks and wraps long messages.

### Saving and refreshing in one request

The form submits a hidden project ID, author, and message to
`addProjectFeedback` in `[id]/actions.ts`. The action checks actual `FormData`
values, trims whitespace, requires both fields, and limits the name to 80
characters and the message to 2,000. Browser attributes guide input; the
server repeats the checks because submissions can bypass the browser form.

`saveProjectFeedback` checks that the project exists before writing anything.
The hidden project ID is editable in browser tools, so rendering a valid form
alone does not establish that the submitted ID is valid.

On success, the action follows this sequence:

```text
saveProjectFeedback(projectId, values)
  -> revalidatePath(`/projects/${projectId}`)
  -> return success feedback and the next form values
```

Next.js can send both the action's result and the newly rendered page in the
same response. `useActionState` receives **Feedback added.**, while the server
history includes the saved note. The form clears the message and keeps the
author's name for another note. There is no extra client fetch or manual
append to a local array.

Validation or storage failures return an error and the entered values so the
user can correct or retry them. While saving, the fields and submit button
are disabled. Changing a project's status uses its separate form and action;
feedback entries remain attached to that project.

### Local persistence and the next backend lesson

`feedback-store.ts` imports `server-only` and writes one JSON file per entry
under `.local-data/feedback/`. Filenames contain the server timestamp and a
UUID. It writes a temporary file, then renames it, so readers see complete
JSON. Separate files allow simultaneous additions without overwriting one
shared array. Entries created in the same millisecond have no guaranteed
order relative to each other.

The reader sorts filenames newest first, reads the entries, and returns only
those matching the requested project ID. A missing feedback directory means
an empty history. This small local store reads all feedback files; a database
will later let us query related records directly and add stronger constraints.

Notes survive reloads and server restarts. `.local-data/` remains excluded
from Git. This lesson still has no accounts or permissions: the entered name
is a display name, not a verified identity. Authentication and project access
checks will be a later milestone before using this as a private client portal.

### Try project feedback

1. Open a project, enter your name and a note, and choose **Add feedback**.
2. See the note in the history immediately. The message field clears and the
   name stays ready for another note.
3. Add a second note with multiple lines. It appears above the first one.
4. Reload the page, then restart the server. The saved notes remain.
5. Open a different project. It has its own feedback history.
6. Submit a whitespace-only message. The form asks you to correct it.

## Milestone 9: Optional PostgreSQL persistence

**Neon** hosts **Lakebase Postgres**, a PostgreSQL-compatible database.
PostgreSQL stores related records in
tables and lets us query them with SQL. Neon saves us from installing and
maintaining a PostgreSQL server locally. It is a provider choice, not a Next.js
requirement. The Neon HTTP driver used here is configured for Neon, rather than
an ordinary local PostgreSQL connection.

You can keep running ReviewRoom without an account or connection string. The
JSON store already persists data locally. A database is our next backend lesson:
it lets us query one project's feedback directly, enforce relationships, and
keep records independently of the web server's disk when we deploy.

### Where the database fits

The existing React forms, `useActionState`, Server Actions, and revalidation
flow still do the same jobs:

```text
React form -> Server Action -> store function -> PostgreSQL
                       <- result and refreshed server-rendered page
```

`database.ts` reads `process.env.DATABASE_URL` and creates a Neon query function.
It imports `server-only`, so importing it from a Client Component is an error.
An unset or blank URL returns `null`, selecting our local store. Once a URL is
configured, the stores use PostgreSQL; connection or query failures reach the
existing error boundary or action feedback. A failed database write never
switches silently to a local file.

Next.js loads `.env.local` from the project root, even though our code is under
`src/`. `DATABASE_URL` has no `NEXT_PUBLIC_` prefix: that prefix would expose a
variable to the browser. The connection string stays on the server and is
excluded from Git. Only the blank `.env.example` is committed.

Server Components can await database queries directly. The list still reads
`getProjects()` and passes plain project objects to `ProjectList`. The detail
page now calls `getProject(id)`, which uses `WHERE id = ...` in database mode
instead of reading every project. Neither page needs a browser fetch or a new
API endpoint. NestJS comes later, when we give a separate backend ownership of
these responsibilities.

### Tables and queries

`db/schema.sql` defines our initial schema:

| Table | Key and relationship | Important fields |
| --- | --- | --- |
| `projects` | `id` is the primary key | Name, client, description, status, creation time |
| `project_feedback` | `id` is the primary key; `project_id` references `projects.id` | Author, message, creation time |

A **primary key** identifies one row and prevents duplicate IDs. A **foreign
key** requires every feedback row to reference an existing project. `CHECK`
constraints enforce allowed statuses and text lengths, in addition to our
Server Actions' validation. An index on the feedback's project ID and timestamp
helps retrieve that project's history in order.

The stores use `SELECT` to read, `INSERT` to create, and `UPDATE` to change a
status. `RETURNING` supplies the saved row in the same query. Values in a Neon
tagged template are query parameters:

```ts
const rows = await sql`
  SELECT id, name, client, status, description
  FROM projects
  WHERE id = ${id}
`;
```

Here, `sql` is a function receiving the template, not an ordinary interpolated
string. Neon sends `id` separately from the SQL, so quotes or SQL-like user input
stay data. Type assertions describe the returned rows to TypeScript; the table
schema enforces their database types and constraints.

Feedback insertion selects the matching project in the same statement and
returns `null` if it is missing. PostgreSQL generates creation timestamps on
new rows. The feedback reader aliases `project_id` to `projectId` and converts
the timestamp to an ISO string for the existing UI. History is newest first,
with the ID breaking timestamp ties.

### Enable the database when ready

The Neon CLI links this workspace to project `solitary-sound-72125343` in
organization `org-lucky-fire-94890121`, using its `production` database branch.
The gitignored `.neon` file stores that local selection. `neon.ts` is the
committed service configuration; this milestone uses Postgres, which every
Neon project includes, and keeps ReviewRoom's existing server-side queries.

1. Install the CLI with `npm.cmd i -g neon@latest`. Run `neon login` yourself
   and complete the browser sign-in using the account that owns the project.
2. From the project root, link the workspace if it is not already linked:

   ```powershell
   neon link -y --org-id org-lucky-fire-94890121 --project-id solitary-sound-72125343 --branch production
   ```

3. Run `neon config plan` to inspect the configuration, then `neon deploy`.
   Deployment applies `neon.ts` to that branch and pulls `DATABASE_URL` and
   `DATABASE_URL_UNPOOLED` into `.env.local` (or `.env` if it already exists).
   These files are excluded from Git. It configures backend services; Next.js
   still runs with its own start command.
4. Stop the development server and run `npm.cmd run db:setup` from the project
   root. This creates the tables and imports your local projects and feedback,
   preserving their IDs and timestamps where available. Locally edited starter
   projects take precedence over `db/seed.sql`'s examples during the first import.
5. Start `npm.cmd run dev` again. Create a project, change its status, and add
   feedback. Reload and restart the server to verify the saved records.
6. Inspect `projects` and `project_feedback` in Neon's Tables view. New app
   writes appear there and no longer create local JSON records.

The app keeps its existing `@neondatabase/serverless` HTTP driver: each store
operation is one parameterized query, without a persistent connection pool.
The setup script uses `DATABASE_URL_UNPOOLED` for schema work, falling back to
`DATABASE_URL` when only that variable is supplied. Future app hosting choices
may call for a different driver; keep database access on the server.

The additional skills installer invoked by `neon init` requires Node.js 22.20
or newer. The CLI can still create its config and install the Neon plugin
before reporting that version error; inspect the generated files before retrying.

`scripts/setup-database.mjs` runs outside Next.js, so it uses `@next/env` to load
the same environment files. It sends the schema, imported records, and starter
examples in one **transaction**: all succeed, or all roll back. Invalid local
records cause a failure without deleting the source files.

Repeating `db:setup` skips existing IDs and imports missing ones. It preserves
subsequent database edits; it does not synchronize updates back and forth with
local files. The `IF NOT EXISTS` statements initialize this schema but do not
alter existing table definitions. Future schema changes need migrations.

To return to local mode, clear `DATABASE_URL` and restart the server. The old
JSON files remain, but records created or changed in PostgreSQL will not be
copied back. Each mode uses its own storage source.

Authentication and access checks are still a later milestone. The database's
foreign key ensures a project exists; it does not establish who may view or
edit it. Feedback names remain unverified display names.

### Follow one request through the code

Start with `projects/[id]/page.tsx`: it awaits the route's `params`, then awaits
`getProject(id)`. In `store.ts`, follow the `getDatabase()` branch to the SQL
query. The returned project becomes JSX on the server; the browser receives
the rendered result and the props needed by the interactive forms.

Then follow `addProjectFeedback` in `[id]/actions.ts`. The browser submits
`FormData`, the action validates it, and `saveProjectFeedback` inserts the row.
`revalidatePath` refreshes the detail page, whose next query includes that note.
The React form still uses `useActionState`; changing storage does not require
an effect, a client fetch, or a second copy of the feedback history in state.

### Milestone validation

The production build and TypeScript checks passed with Neon's `.env.local`.
Deployment confirmed that the `production` branch matched `neon.ts` and pulled
its environment variables. Initial setup added 3 projects and 2 feedback entries;
running setup again added none. All 5 local records were confirmed in Neon.

Browser checks against the production Next.js server covered project creation,
status changes, feedback validation, pending states, form reset, ordering,
project isolation, and persistence after a server restart. Independent Neon
queries confirmed the browser-created project's Approved status and both notes,
while the local JSON files stayed unchanged. Temporary test records were removed.

SQL queries and setup were also exercised with PGlite, a local PostgreSQL engine,
including parameterized input, constraints, repeated imports, transaction
rollback, and selection of the direct URL for schema setup.

## Milestone 10: Starting the NestJS backend

NestJS is a framework for a server application. Next.js currently renders our
React pages and performs database operations. We are now introducing a separate
NestJS process that will gradually take ownership of the API and database work.
The first step is an HTTP endpoint that confirms the new server can respond.

### Run the two applications

The backend has its own `package.json` and lockfile. From the repository root,
install its packages once:

```powershell
cd backend
npm.cmd install
cd ..
```

Keep Next.js running in one terminal with `npm.cmd run dev`. In a second
terminal, also at `D:\reviewroom`, run:

```powershell
npm.cmd run api:dev
```

Next.js normally uses port **3000**. Our API listens on **3001** at `127.0.0.1`,
so the two processes can run together on your machine. A port identifies which
server should receive a request to the same computer.

Open http://127.0.0.1:3001/health in a browser. It returns HTTP status **200**
with this JSON body:

```json
{ "status": "ok", "service": "reviewroom-api" }
```

This endpoint confirms that Nest can handle a request. It does not query Neon
or check database connectivity. Next.js and NestJS are not connected yet.

### The four source files

```text
backend/
  package.json          Backend packages and commands
  package-lock.json     Exact installed dependency versions
  tsconfig.json         Backend TypeScript compilation settings
  src/
    main.ts             Creates the application and starts listening
    app.module.ts       Registers the controller and service
    health.controller.ts  Defines GET /health
    health.service.ts   Supplies the health response
```

**1. Bootstrap: `main.ts`**

`bootstrap()` is an ordinary async function. Its name is a convention; the
`void bootstrap()` call at the end runs it. `void` discards the returned Promise;
it does not change what the function does or catch errors.

`NestFactory.create(AppModule)` builds a Nest application from the root module.
`app.listen(3001, "127.0.0.1")` starts accepting local HTTP requests. Unlike a
Next.js `page.tsx`, this file does not render a React component.
`enableShutdownHooks()` lets Nest run cleanup hooks when the process receives
supported shutdown signals. Ctrl+C stops the development command.

**2. Registration: `app.module.ts`**

`@Module(...)` is a **decorator**: a function that attaches information to the
class beneath it. Nest reads that information to assemble the application.

The `controllers` array registers classes that handle HTTP requests. The
`providers` array registers dependencies Nest can create and supply, including
our `HealthService`. `AppModule` is the root module because we pass it to
`NestFactory.create`. Later, a projects module can group the project's related
controller and service together.

**3. Routing: `health.controller.ts`**

`@Controller("health")` establishes the URL prefix `/health`. `@Get()` on the
method establishes the HTTP method and adds no further path, giving us
`GET /health`. A browser's address bar sends a GET request when opening this URL.
The class and method names do not determine the URL; the decorators do.

The constructor asks Nest for a `HealthService`:

```ts
constructor(private readonly healthService: HealthService) {}
```

This TypeScript shorthand declares a private instance property and assigns the
constructor argument to it. `readonly` prevents our code from reassigning the
property. Nest creates the registered service and passes it into the constructor;
we do not call `new HealthService()` in the controller. This is **dependency
injection**: a class receives the dependency it needs from outside itself.

The handler calls `this.healthService.getHealth()` and returns its result.
Nest's default Express adapter serializes that plain object to JSON and sends
the HTTP response. There is no JSX or `"use server"` directive in the backend.

**4. Providing the result: `health.service.ts`**

`@Injectable()` attaches metadata so the class can participate in Nest's
dependency injection system. Registering it in `AppModule.providers` makes it
available to our controller. Its `getHealth()` method currently returns a
constant object. We use a small service here to see how injection works; the
projects service will perform the real database work in the next milestone.

Follow the complete request:

```text
Browser GET http://127.0.0.1:3001/health
  -> HealthController.getHealth()
  -> HealthService.getHealth()
  -> plain object
  -> Nest sends HTTP 200 and JSON to the browser
```

The root module participates at startup by registering these classes; it is
not a method that runs between the controller and service on every request.

### Packages and TypeScript

`@nestjs/core` builds the app and manages dependency injection. `@nestjs/common`
provides decorators such as `Module`, `Controller`, `Get`, and `Injectable`.
`@nestjs/platform-express` connects Nest to Express for HTTP handling.
`reflect-metadata` supports runtime metadata, and `rxjs` supports Nest's
observable-based internals. TypeScript compiles our backend, and `tsc-watch`
recompiles it during development and runs the resulting server. We can create
these few files directly without a Nest CLI installation.

Nest uses TypeScript's decorator settings. `experimentalDecorators` enables
its decorator syntax, and `emitDecoratorMetadata` preserves information such
as constructor parameter types for dependency injection. We import
`reflect-metadata` before creating the application.

The backend compiles TypeScript to CommonJS JavaScript in `backend/dist/`, which
Node executes. That generated directory is ignored by Git. Next.js has its own
compiler settings, so the root `tsconfig.json` excludes `backend/`. Each
application checks its own source using its own configuration.

`api:dev` runs `tsc-watch`: it recompiles and restarts the API after a successful
compilation when backend source changes. The root `api:*` scripts use `npm --prefix backend`
to run commands from the backend package. For a production-style local run:

```powershell
npm.cmd run api:build
npm.cmd run api:start
```

`api:build` creates `backend/dist/`; `api:start` runs `dist/main.js` without
watching source files. `npm.cmd run api:typecheck` checks the backend without
generating JavaScript. Stop `api:dev` before `api:start`, since both use port 3001.

### Try the first endpoint

1. Start `npm.cmd run api:dev` and open `/health` on port 3001.
2. Find the returned `service` value in `health.service.ts`.
3. Temporarily change that value, save, and reload the browser. Watch mode
   restarts the server and the JSON reflects your change. Restore it afterward.
4. Visit `/missing` on port 3001. Nest returns HTTP 404 because no controller
   handles that path.
5. Follow the controller's constructor to `AppModule.providers` to see where
   its service is registered.

### Milestone validation

The NestJS build and the existing Next.js production build passed, including
TypeScript checking. HTTP checks against the compiled API confirmed `/health`
returns status 200 and the expected JSON, and an unknown route returns 404.
Development mode was checked by temporarily changing the service response:
the watcher recompiled and restarted the API, and the HTTP response changed.
Restoring the source triggered another restart and restored the original JSON.
Backend dependency installation completed without engine warnings or reported
vulnerabilities after selecting the compatible TypeScript watcher.

The next milestone adds `GET /projects` and `GET /projects/:id` backed by Neon.
Once those endpoints work, we will connect the Next.js Server Components to
them, then move project creation, status changes, and feedback in later steps.

## Milestone 11: Reading projects through NestJS

Our API now reads the existing Neon `projects` table. We are introducing the
HTTP boundary first: Next.js still uses its existing store functions, while
the new NestJS routes let us inspect the same database records as JSON.

### Run and inspect the API

The backend now also depends on `@nestjs/config` and the same
`@neondatabase/serverless` driver used by our Next.js store. After pulling this
milestone, run `npm.cmd install` from `backend/` to install its updated packages.
From the repository root, start `npm.cmd run api:dev` and open:

| Request | Result |
| --- | --- |
| `GET /health` | HTTP 200 and the server's health response |
| `GET /projects` | HTTP 200 and an array of projects |
| `GET /projects/brand-identity` | HTTP 200 and that project's object, if it exists |
| `GET /projects/missing-project` | HTTP 404 when no row has that ID |
| A project read without working database configuration | HTTP 503 |

Use port 3001, for example http://127.0.0.1:3001/projects. An empty table returns
`[]` with status 200. A missing project and an unavailable database are different
outcomes; a database failure does not become a false 404 or an empty list.

### Grouping a feature in a module

The new source files live together:

```text
backend/src/projects/
  projects.module.ts      Registers this feature and its configuration dependency
  projects.controller.ts Defines the two HTTP routes
  projects.service.ts    Reads Neon records
  project.ts             Describes the project response fields in TypeScript
```

`AppModule` now imports `ProjectsModule`. This lets Nest discover its registered
controller and service. Adding a file alone does not register it with Nest.
The health controller and service keep their existing registration.

`ProjectsModule` has three arrays:

- `imports` brings in another module's exported dependencies. Here we import
  the configured `ConfigModule`, which makes `ConfigService` available.
- `controllers` registers `ProjectsController` to handle HTTP requests.
- `providers` registers `ProjectsService` for dependency injection.

Modules let us organize related backend responsibilities without putting every
class directly into the root module. We have not made our providers global;
the module's explicit imports show where its dependencies come from.

### Loading the existing database configuration

Next.js loads environment files automatically. Our separate NestJS process
uses `ConfigModule.forRoot(...)` to load the repository root's `.env.local`,
then `.env`. The first file wins when both define the same key. Environment
variables supplied directly to the process take precedence over these files.
This is the backend's explicit two-file configuration; it does not reproduce
Next.js's additional environment-specific file selection.

The module resolves the root from `__dirname`, which is the directory containing
that module. Both `backend/src/projects` and the compiled
`backend/dist/projects` are three directories below the repository root. This
keeps configuration lookup independent of the terminal's current directory.

The existing root `DATABASE_URL` configures both applications for this lesson.
No connection string is copied into source code, sent to the browser, or added
to Git. The Nest project endpoints require Neon configuration; Next.js retains
its own optional local JSON mode. Use the existing `db:setup` command if the
database has not been initialized. Reading projects does not initialize or
change the schema.

### From an HTTP route to a service call

`@Controller("projects")` sets the prefix `/projects`. The controller's
`@Get()` method handles that path and returns the service's Promise. Nest waits
for it to resolve, then serializes the result to JSON.

The second method starts with:

```ts
@Get(":id")
async getProject(@Param("id") id: string) {
  const project = await this.projectsService.getProject(id);
```

`:id` captures a URL segment, and `@Param("id")` supplies it as the method's
argument. This is the Nest equivalent of capturing an ID with Next.js's `[id]`
folder. The Nest decorators define the route; the folder and method names do
not. IDs remain strings because our starter records use values such as
`brand-identity`, alongside UUIDs for newly created projects.

The service returns a project or `null`. The controller maps `null` to
`throw new NotFoundException("Project not found.")`. Nest catches that HTTP
exception and sends a 404 JSON response. This is separate from Next.js's
`notFound()`, which renders a nearby `not-found.tsx` page.

### Reading Neon in the service

Nest injects `ConfigService` into the service's constructor, just as it injects
`ProjectsService` into the controller. `getDatabase()` reads and trims
`DATABASE_URL`, then calls `neon(connectionString)` to obtain a query function.
The HTTP driver sends database requests without maintaining a persistent pool.

`getProjects()` selects the existing five project fields and orders them by
creation time, newest first, with ID breaking timestamp ties. `getProject(id)`
selects one row using:

```ts
const rows = await sql`
  SELECT id, name, client, status, description
  FROM projects
  WHERE id = ${id}
`;
```

The tagged template sends `id` as a query parameter separately from SQL.
Quotes or SQL-like text in the URL stay data. `rows[0]` supplies the single
matching row, or the method returns `null` when there is none.

The backend's `Project` type describes the same five fields as the current
Next.js project type. TypeScript assertions describe rows to the compiler;
they do not validate JSON or database rows at runtime. PostgreSQL's schema
continues to enforce its column types, lengths, and allowed statuses.

Both read methods translate missing configuration or database request failures
into `ServiceUnavailableException`, which produces HTTP 503. A backend log
provides a configuration/connectivity hint; the response contains a stable
message rather than a raw driver error or connection string. `/health` remains
an independent check that the HTTP server responds.

Follow a detail request through the application:

```text
GET /projects/brand-identity
  -> ProjectsController.getProject(id)
  -> ProjectsService.getProject(id)
  -> ConfigService supplies DATABASE_URL
  -> parameterized Neon SELECT
  -> project JSON (200), missing project (404), or unavailable storage (503)
```

### Try the new routes

1. Open `/projects` on port 3001 and inspect the array.
2. Copy an ID from the array and open `/projects/<that-id>` on the same port.
3. Compare that object with the same project in the Next.js UI on port 3000.
4. Visit `/projects/missing-project` and inspect its 404 JSON response.
5. Follow `AppModule.imports` to `ProjectsModule`, then follow the controller's
   constructor to the service and its injected `ConfigService`.

### Milestone validation

The backend build passed with TypeScript checking. HTTP checks against the
compiled Nest application compared the project list and all 3 detail responses
with independent Neon reads. Missing and SQL-like IDs returned 404. Absent and
malformed database configuration returned 503 without exposing configuration
values, while `/health` continued to return 200.

Simulated database request failures returned 503 for both project routes, and
successful reads resumed after restoring connectivity. Verification queried
existing records without adding, updating, or deleting database data.

The next milestone will make the Next.js project pages fetch these endpoints.
Project creation, status updates, and feedback will move across in later steps.

## Startup files

- `package.json` lists the packages the app needs and its runnable commands.
  `next` supplies the framework, `react` supplies React, and `react-dom` supplies
  React's web rendering tools. The `private` flag prevents accidental npm
  publication; it does not control access to the website.
- `package-lock.json` records the dependency versions installed by npm.
- `tsconfig.json` configures TypeScript checks. `strict` enables stricter checks;
  `noEmit` leaves application output generation to Next.js.
- `next-env.d.ts` is generated by Next.js to make framework types available.
- `node_modules/` contains installed packages; `.next/` contains generated output.
  These generated directories are excluded by `.gitignore`.
- The `metadata` export in our layout supplies the browser tab title and page
  description. The CSS import applies our stylesheet to every page.
- `AGENTS.md` includes guidance for the coding assistant and a block maintained
  by Next.js. It does not affect the rendered app.

`npm.cmd run dev` starts the development server with automatic updates when
source files change. `npm.cmd run build` prepares a production build;
`npm.cmd start` serves that build. `npm.cmd run typecheck` checks TypeScript.
`npm.cmd run db:setup` initializes the configured development database and
imports local records; it requires `DATABASE_URL`.
`npm.cmd run api:dev` starts the separate NestJS backend after installing its
dependencies with `npm.cmd install` from the `backend/` directory.

## Try it

1. Visit `/`, then follow **View projects** to `/projects`.
2. Notice that the navigation appears on both pages.
3. Change the wordmark text in `layout.tsx`; observe it on both pages.
4. Change the heading in `projects/page.tsx`; observe that only that page changes.
5. On `/projects`, select **Approved**, then **Awaiting feedback**, then
   **All statuses**. Watch the list and the URL's `status` parameter change.
6. Select **Approved** and reload the page. The URL preserves the filter.
7. Open either project name. Compare the URL, title, client, and status, then
   use **Back to projects**.
8. Visit `/projects/missing-project` to see the missing-project page.
9. Follow **New project**, fill in the three fields, and choose **Create project**.
   Find the new project in the list and open its detail page.
10. Reload the page. The saved project remains available.
11. Enter only spaces for the project name while filling the other fields.
    The server will ask you to correct the form and preserve the other values.
12. Open a project, select **Approved**, and choose **Save status**. The status
    shown above the form updates and a **Status saved.** message appears.
13. Reload the detail page, then return to the list and filter by **Approved**.
    The saved status is used in both places. Try this with a starter project too.

## Git checkpoints

Each working milestone gets a focused local Git commit after validation.
Use `git log --oneline` to see the checkpoints and `git show <commit>` to
inspect what changed at a particular step.

## Architecture we will build toward

Next.js currently handles the web application and its project database operations.
NestJS now has health and project read endpoints backed by the same Neon database.
Next, we will have Next.js request project data from that API. Later steps will
move the remaining database operations and business logic into NestJS.
Database credentials stay on the server throughout.

We now have project creation, status updates, a URL filter, and project feedback
with local persistence and optional PostgreSQL storage. Future lessons will
cover authentication, project permissions, schema migrations, and deployment.
Our NestJS lessons have now started, using those existing backend
responsibilities as the examples we will move across.
