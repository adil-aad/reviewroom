# ReviewRoom

A client feedback and approval portal we are building to learn Next.js, then
NestJS. You can create projects, update their status with Server Actions,
filter the project list, and open individual project pages. Two example
projects are included; saved projects live in local JSON files. Database
access comes later.

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
    ProjectList.tsx    Interactive list and status filter
    data.ts            Example projects and shared TypeScript types
    store.ts           Server-only reading and saving of local project files
    new/
      page.tsx         Create-project page at /projects/new
      NewProjectForm.tsx  Form, validation feedback, and pending state
      actions.ts       The createProject Server Action
    [id]/
      page.tsx         Project details at /projects/:id
      ProjectStatusForm.tsx  Status selector, pending state, and feedback
      actions.ts       The changeProjectStatus Server Action
      not-found.tsx    Message for an unknown project ID
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
JavaScript that will run in the browser. It allows the component to use
`useState` and handle the dropdown's `onChange` event. Importing this component
does not turn its parent page into a Client Component.

The `projects` array is sent to the client component as props. These props must
be serializable by React; our objects contain plain strings. A Server Component
can keep its own code on the server while still sending data to the browser.

The filter uses one state variable, `status`, and calculates `visibleProjects`
from the current props and selection. Changing the selection updates the list
in the browser. The original array stays the same, and the selected filter is
not saved to a database or the URL.

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
   **All statuses**. Watch the list change while the URL stays the same.
6. Reload the page. The filter starts at **All statuses** again because its
   initial state is `"All"`.
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

Each working milestone gets a local Git commit after validation. Use
`git log --oneline` to see the checkpoints and `git show <commit>` to inspect
what changed at a particular step.

## Architecture we will build toward

Initially, Next.js will handle the web application and its server work. When we
introduce a database, its credentials will stay on the server. Later, NestJS will
own the dedicated API, business logic, and database access. Next.js will continue
to serve the React application and can request data from that API.

Upcoming features cover reading and changing data, persistence, authentication
and permissions, client feedback, approvals, then deployment. NestJS will be
introduced after the Next.js foundations are clear, at a point where the
backend responsibilities are concrete.
