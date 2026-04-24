## Tech Stack

- React 19 (TypeScript) + Vite
- Tailwind CSS 4
- TanStack React Query 5 (server state)
- React Router 7 (single route only)
- React built-in state only (useState / useReducer) — no external state libraries

## Project Structure

```
src/
├── components/
│   ├── features/
│   │   ├── FileTree/
│   │   │   ├── FileTree.tsx          # Root tree component (sidebar)
│   │   │   ├── TreeNode.tsx          # Recursive folder/file node
│   │   │   └── TreeActions.tsx       # Context menu (rename, delete, new file/folder)
│   │   └── Editor/
│   │       ├── FeatureEditor.tsx     # Top-level form: name, description, scenario list, save
│   │       ├── ScenarioEditor.tsx    # Single scenario: name + step list
│   │       └── StepEditor.tsx        # Single step: keyword dropdown + text input
│   └── ui/
│       ├── Button.tsx                # Reusable button component
│       ├── Modal.tsx                 # Reusable modal dialog
│       └── ConfirmDialog.tsx         # Delete confirmation dialog
├── services/
│   ├── api.ts                        # Base fetch client — all HTTP calls go here
│   └── featureApi.ts                 # React Query hooks for all /api/v1/features/* endpoints
├── types/
│   └── index.ts                      # Step, Scenario, FeatureBody, FileTreeEntry, etc.
├── lib/
│   └── utils.ts                      # cn() — conditional class helper
├── App.tsx                           # Router setup (single route), QueryClientProvider
├── main.tsx                          # React root + StrictMode
└── index.css                         # Tailwind directives
```

Key differences from template:
- No `pages/HomePage.tsx` — the single page is composed directly in `App.tsx` or a top-level layout
- Feature-based component directories under `components/features/`
- `featureApi.ts` replaces `itemApi.ts`
- Types mirror backend Pydantic schemas (Step, Scenario, FeatureBody, FileTreeEntry)

## Architecture Rules

- **API layer is the boundary.** All HTTP calls go through `services/api.ts`. Never use `fetch` directly in components.
- **Server state via React Query.** Use `useQuery` for reads (tree, file content), `useMutation` for writes (create, update, rename, delete, sync). Invalidate related queries on success (e.g., invalidate `tree` after any mutation; invalidate the `file` query after update).
- **Component state for UI only.** File selection (which file is open in the editor), expand/collapse state, and form editing state are all managed with `useState` / `useReducer`. No Zustand or other external state management.
- **No URL-driven file selection.** The selected file is component state, not a URL parameter. There is only one route (`/`).
- **Path alias:** `@` maps to `./src` (configured in `vite.config.ts` and `tsconfig`).
- **API base URL:** Set via `VITE_API_URL` env var (defaults to `http://localhost:8000`).
- **Two-panel layout:** Left sidebar = file tree, right panel = feature editor. The editor panel shows an empty/placeholder state when no file is selected.
- **Tree shows contents of `initiatives/` as root nodes.** The user never sees the `initiatives/` folder itself — the backend already returns the tree rooted at its contents.

## Component Architecture

### File Tree (left sidebar)
- **FileTree** — receives the tree data from React Query, renders top-level nodes, provides "New Folder" and "New File" buttons at the top, and a "Sync" button.
- **TreeNode** — recursive component for a single folder or file. Folders expand/collapse on click. Files trigger selection (sets component state). Each node has a context action area for rename/delete.
- **TreeActions** — contextual action buttons/menu for rename and delete on a tree node.

### Feature Editor (right panel)
- **FeatureEditor** — top-level form. Receives a `FeatureBody` (from the selected file's React Query data). Contains inputs for feature name and description, a list of `ScenarioEditor` components, an "Add Scenario" button, and a "Save" button that triggers the update mutation.
- **ScenarioEditor** — a single scenario within the feature. Contains a name input, a list of `StepEditor` components, an "Add Step" button, and a "Remove Scenario" button.
- **StepEditor** — a single step within a scenario. Contains a keyword dropdown (Given/When/Then/And/But), a text input, and a "Remove Step" button.

### Data Flow
1. User selects a file in FileTree → `selectedPath` state updates
2. React Query fetches file content for `selectedPath` → populates FeatureEditor form
3. User edits form → local form state (useState/useReducer)
4. User clicks Save → `useMutation` sends PUT request → on success, invalidates file + tree queries
5. Mutations (create/rename/delete) → invalidate tree query → tree re-renders

## React Query Hooks

All hooks are defined in `services/featureApi.ts`:

| Hook                    | Type       | Endpoint                           | Query Key / Invalidation     |
|-------------------------|------------|------------------------------------|------------------------------|
| `useFileTree()`         | useQuery   | GET /api/v1/features/tree          | `["features", "tree"]`       |
| `useFeatureFile(path)`  | useQuery   | GET /api/v1/features/file/{path}   | `["features", "file", path]` |
| `useCreateFolder()`     | useMutation| POST /api/v1/features/folders      | invalidates `tree`           |
| `useCreateFile()`       | useMutation| POST /api/v1/features/files        | invalidates `tree`           |
| `useUpdateFile()`       | useMutation| PUT /api/v1/features/file/{path}   | invalidates `tree` + `file`  |
| `useRenameEntry()`      | useMutation| PATCH /api/v1/features/{path}/rename | invalidates `tree`         |
| `useDeleteEntry()`      | useMutation| DELETE /api/v1/features/{path}     | invalidates `tree`           |
| `useSyncRepo()`         | useMutation| POST /api/v1/features/sync         | invalidates all `features`   |

`useFeatureFile(path)` should be disabled when `path` is null/undefined (no file selected).

## TypeScript Types

Defined in `types/index.ts`, mirroring backend Pydantic schemas:

```typescript
interface Step {
  keyword: "Given" | "When" | "Then" | "And" | "But";
  text: string;
}

interface Scenario {
  name: string;
  steps: Step[];
}

interface FeatureBody {
  name: string;
  description?: string;
  scenarios: Scenario[];
}

interface FeatureFile {
  path: string;
  feature: FeatureBody;
}

interface FileTreeEntry {
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileTreeEntry[];
}

interface FolderCreate {
  path: string;
}

interface FileCreate {
  path: string;
  feature: FeatureBody;
}

interface RenameRequest {
  new_name: string;
}
```

## Coding Conventions

- The app is a single-page layout, not a multi-page app. There is no `pages/` directory.
- Components are in `components/features/` (feature-specific) or `components/ui/` (generic reusable).
- Each feature component directory groups related components (e.g., `FileTree/` contains `FileTree.tsx`, `TreeNode.tsx`, `TreeActions.tsx`).
- Types live in `types/index.ts` and mirror backend Pydantic schemas.
- API services are thin wrappers: one function per endpoint, typed return values.
- React Query hooks live alongside their API functions in `services/featureApi.ts`.
- Tailwind classes directly in JSX. Use `cn()` from `lib/utils.ts` for conditional classes.
- Named exports for all components (`export function FileTree()`), not default exports.
- Form state is managed with `useState` or `useReducer` inside the editor components. No form libraries.
