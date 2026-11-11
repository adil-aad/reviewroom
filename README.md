# ReviewRoom

A client feedback and approval portal we are building to learn Next.js, then
NestJS. You can create projects, update their status with Server Actions,
filter the project list with a shareable URL, and add feedback on individual
project pages. Each project's feedback can be downloaded as JSON. Two example
projects are included; saved projects and feedback
live in local JSON files. Database access comes later. Project routes include
loading feedback and a recovery screen for unexpected rendering errors.

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
    store.ts           Server-only reading and saving of local project files
    feedback-store.ts  Server-only reading and saving of project feedback
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
      feedback/
        route.ts       GET handler for a project's feedback download
```

`layout.tsx` receives the matching page as its `children` prop. The shared
navigation sits outside `{children}`, so it appears on both pages. The component
name does not determine the URL; the file location does.

Navigation uses `Link` from `next/link`. It links to another route and lets
Next.js handle navigation within the app. Our source page and layout files are
Server Components by default.

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
with `const { id } = await params`. It reads the available projects, then uses
`.find()` to select the matching project and render its details.

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

## Milestone 9: Route Handlers and a feedback download

Each project detail page has a **Download feedback** link below **Feedback
history**. It requests `/projects/:id/feedback` and downloads a readable JSON
file containing the project and its feedback, with the newest notes first.
A project with no notes still downloads successfully, with `"feedback": []`.
The file is a snapshot of the saved data at the time of the request.

### A URL that returns data

The file `projects/[id]/feedback/route.ts` defines this URL. A `route.ts` can
live anywhere under `app`; an `api` folder is a naming convention rather than
a requirement. We place it in the `feedback` subfolder because `route.ts` and
`page.tsx` cannot own the same URL. The project page remains at `/projects/:id`.

Next.js calls the handler's named `GET` export for an HTTP GET request. It
receives a `Request` and a context object. Our `_request` parameter is unused;
we need the context's `params`, which is a Promise in this Next.js version:

```ts
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Find the project, read its feedback, and return a Response.
}
```

The handler reuses `getProjects()` and `getProjectFeedback()`, just as the
Server Component does. The detail page still reads these functions directly;
it does not make an HTTP request to its own download handler.

### Body, status, and headers

The successful response uses the standard Web `Response` API:

```ts
return new Response(JSON.stringify({ project, feedback }, null, 2) + "\n", {
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Disposition": `attachment; filename="feedback-${encodeURIComponent(project.id)}.json"`,
    "Cache-Control": "no-store",
  },
});
```

`JSON.stringify` creates the response body; `null, 2` indents the file for
reading. The response status defaults to **200 OK**. `Content-Type` describes
the body, and `Content-Disposition: attachment` asks the browser to download
it with a suggested filename. That filename uses the project's stable ID.
`Cache-Control: no-store` tells browsers and intermediaries not to store a
copy of the response, so another download requests the current saved data.
GET Route Handlers run at request time by default in our installed version.

The link is a regular `<a href="..." download>`. It requests a file through
the browser's native download flow; Next.js `Link` is for navigation between
our UI routes. The download keeps the project page open and needs no Client
Component, click handler, or `"use server"` directive.

If the project does not exist, the handler returns
`Response.json({ error: "Project not found." }, { status: 404, ... })`.
If reading local data fails, it logs the original error on the server and
returns a generic JSON error with status **500**. Error responses have no
attachment header. They are HTTP responses; the React `error.tsx` and
`not-found.tsx` screens belong to our page rendering.

| Server entry point | ReviewRoom example | Result |
| --- | --- | --- |
| `page.tsx` | `/projects/:id` | Renders the project UI |
| Server Action | `addProjectFeedback` | Saves submitted form data and refreshes the page |
| `route.ts` | GET `/projects/:id/feedback` | Returns a JSON file or an HTTP error |

We export only `GET`. Next.js also supplies HEAD and OPTIONS automatically
and returns **405 Method Not Allowed** for a method such as POST. Downloading
reads data; it does not create a note or change the project.

### Try the download

1. Open a project and choose **Download feedback**. Open the JSON file in your
   editor and compare its `project` and `feedback` fields with the page.
2. Add another note, then download again. The new file includes the new note.
3. Download feedback from a different project. Only its own notes are included.
4. Download from a project with no notes; its feedback array is empty.
5. Open `/projects/missing-project/feedback` directly. The response is JSON
   with status 404. Inspect its status and headers in the browser's Network tab.

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

Initially, Next.js will handle the web application and its server work. When we
introduce a database, its credentials will stay on the server. Later, NestJS will
own the dedicated API, business logic, and database access. Next.js will continue
to serve the React application and can request data from that API.

We now have project creation, status updates, a URL filter, and project feedback
with local persistence. Future lessons will cover database persistence,
authentication, project permissions, and deployment. NestJS will be introduced
after the Next.js foundations are clear, at a point where the backend
responsibilities are concrete.
