# Gherkin Requirements Manager — Implementation Plan

## Overview

Transform the existing template app (Item/Dictionary CRUD over SQLite) into a **Gherkin Requirements Manager**: a web-based tool that lets teams create, edit, and browse `.feature` files stored in a GitHub repository. Git is the only data store — no database.

**Approach:** TDD — every phase starts with tests, then implementation to make tests pass. Tasks are ordered so each one builds on the last with no orphans and no large complexity jumps.

---

## Phase 1 — Backend: Project Scaffolding & Configuration

**Goal:** Remove template code, update dependencies, and set up configuration. After this phase the project compiles and `make test` runs (with zero tests).

### Task 1 — Remove template backend code
* **ID:** 1 | **Dependencies:** none
    - [ ] 1.1: Delete `backend/app/models/` directory (base.py, item.py, word.py) — ORM models are not needed.
    - [ ] 1.2: Delete `backend/app/core/database.py` — no database in this project.
    - [ ] 1.3: Delete `backend/app/schemas/item.py` and `backend/app/schemas/word.py`.
    - [ ] 1.4: Delete `backend/app/services/item_service.py` and `backend/app/services/dictionary_service.py`.
    - [ ] 1.5: Delete `backend/app/api/v1/items.py` and `backend/app/api/v1/dictionary.py`.
    - [ ] 1.6: Delete `backend/scripts/seed_db.py`.
    - [ ] 1.7: Delete all existing test files: `backend/tests/test_items_router.py`, `test_dictionary_router.py`, `test_dictionary_service.py`, `test_models.py`, `test_schemas.py`.
    - [ ] 1.8: Clear `backend/tests/conftest.py` to an empty file (keep the file for later).
    - [ ] 1.9: Strip `backend/main.py` down to a minimal FastAPI app: keep CORS middleware, remove all router includes and the SQLAlchemy lifespan. Add an empty `lifespan` async context manager placeholder.
    - [ ] 1.10: Verify the backend starts without errors (`make server` or `uvicorn main:app`).

### Task 2 — Update backend dependencies
* **ID:** 2 | **Dependencies:** 1
    - [ ] 2.1: In `backend/pyproject.toml`, add `gitpython` as a dependency.
    - [ ] 2.2: Remove `sqlalchemy`, `aiosqlite`, and `python-multipart` from dependencies.
    - [ ] 2.3: Ensure `pydantic-settings` is still present.
    - [ ] 2.4: Run `poetry lock && poetry install` inside the backend container and confirm no import errors.

### Task 3 — Backend configuration (Settings)
* **ID:** 3 | **Dependencies:** 2
    - [ ] 3.1: Write a test in `backend/tests/test_config.py` that imports `Settings` from `app.core.config`, instantiates it with `APP_GITHUB_REPO_URL`, `APP_GITHUB_PAT`, and optional `APP_CLONE_DIR`, and asserts all fields are set correctly. Assert `APP_CLONE_DIR` has a sensible default value.
    - [ ] 3.2: Rewrite `backend/app/core/config.py`: define a `Settings` class (pydantic-settings, env prefix `APP_`) with fields `github_repo_url: str`, `github_pat: str`, `clone_dir: str = "./repo_clone"`. Provide a `get_settings()` function with `@lru_cache`.
    - [ ] 3.3: Run `make test` — `test_config.py` passes.

---

## Phase 2 — Backend: Pydantic Schemas

**Goal:** Define all Pydantic models that form the API contract. These are pure data classes with no side effects, so they can be tested immediately.

### Task 4 — Schema tests
* **ID:** 4 | **Dependencies:** 3
    - [ ] 4.1: Create `backend/tests/test_schemas.py`. Write a test that instantiates a `Step` with `keyword="Given"` and `text="a user exists"` and asserts field values. Write a test that `Step` rejects an invalid keyword (not one of Given/When/Then/And/But).
    - [ ] 4.2: Write a test that instantiates a `Scenario` with a name and a list of `Step` objects and asserts the structure.
    - [ ] 4.3: Write a test that instantiates a `FeatureBody` with name, optional description, and a list of `Scenario` objects. Assert that `description` defaults to `None` when omitted.
    - [ ] 4.4: Write a test that instantiates `FeatureFile` with `path` and a `FeatureBody` and asserts field values.
    - [ ] 4.5: Write a test that instantiates `FileTreeEntry` with `name`, `type="folder"`, `path`, and a `children` list containing another `FileTreeEntry`. Assert recursive structure works.
    - [ ] 4.6: Write tests for `FolderCreate` (requires `path`), `FileCreate` (requires `path` + `feature: FeatureBody`), and `RenameRequest` (requires `new_name`).
    - [ ] 4.7: Run `make test` — all schema tests fail with `ImportError` (module not yet created).

### Task 5 — Schema implementation
* **ID:** 5 | **Dependencies:** 4
    - [ ] 5.1: Create `backend/app/schemas/feature.py`. Implement `Step` with a `keyword` field constrained to `Literal["Given", "When", "Then", "And", "But"]` and a `text: str` field.
    - [ ] 5.2: Implement `Scenario` with `name: str` and `steps: list[Step]`.
    - [ ] 5.3: Implement `FeatureBody` with `name: str`, `description: str | None = None`, and `scenarios: list[Scenario]`.
    - [ ] 5.4: Implement `FeatureFile` with `path: str` and `feature: FeatureBody`.
    - [ ] 5.5: Implement `FileTreeEntry` with `name: str`, `type: Literal["file", "folder"]`, `path: str`, and `children: list[FileTreeEntry] | None = None`. Add `model_config` for recursive model rebuild if needed.
    - [ ] 5.6: Implement `FolderCreate` with `path: str`, `FileCreate` with `path: str` and `feature: FeatureBody`, and `RenameRequest` with `new_name: str`.
    - [ ] 5.7: Run `make test` — all `test_schemas.py` tests pass.

---

## Phase 3 — Backend: Git Service

**Goal:** Build the git integration layer that clones, pulls, and commits+pushes to a local bare repo. This is the persistence foundation for everything else.

### Task 6 — Git service test fixtures
* **ID:** 6 | **Dependencies:** 5
    - [ ] 6.1: In `backend/tests/conftest.py`, create a `git_repo` pytest fixture using `tmp_path`. The fixture should: (a) initialize a bare git repo (`git init --bare`), (b) clone it to a working directory, (c) create an `initiatives/` folder with a sample `.feature` file, (d) commit and push, (e) yield a dict with `bare_repo_path`, `clone_dir`, and `repo_url` (file:// URL to the bare repo). Clean up by restoring any overridden settings.
    - [ ] 6.2: Create a helper fixture `override_settings` that patches `app.core.config.get_settings()` to return test settings pointing at the temp repo. This fixture should accept `repo_url` and `clone_dir` and set `github_pat=""` (not needed for local file:// repos).
    - [ ] 6.3: Verify the fixture works by writing a trivial test that uses `git_repo` and asserts the bare repo path exists. Run `make test` — trivial test passes.

### Task 7 — Git service tests
* **ID:** 7 | **Dependencies:** 6
    - [ ] 7.1: Create `backend/tests/test_git_service.py`. Write a test for `clone_repo(repo_url, clone_dir, pat)` that asserts: (a) after calling clone, the `clone_dir` exists, (b) the `initiatives/` folder is present inside the clone, (c) the sample `.feature` file from the fixture is present.
    - [ ] 7.2: Write a test for `pull_repo(clone_dir)` that: (a) makes a change directly in the bare repo (via a second clone, commit, push), (b) calls `pull_repo` on the original clone, (c) asserts the new change is visible.
    - [ ] 7.3: Write a test for `commit_and_push(clone_dir, message)` that: (a) creates a new file in the clone's `initiatives/` folder, (b) calls `commit_and_push`, (c) verifies the commit exists in the bare repo (via `git log` on the bare repo).
    - [ ] 7.4: Write a test that verifies `clone_repo` is a no-op (or does a pull) if the `clone_dir` already exists — ensures idempotent startup.
    - [ ] 7.5: Run `make test` — all git service tests fail with `ImportError`.

### Task 8 — Git service implementation
* **ID:** 8 | **Dependencies:** 7
    - [ ] 8.1: Create `backend/app/services/git_service.py`. Import `git` from GitPython and `asyncio`.
    - [ ] 8.2: Implement an `asyncio.Lock` at module level for serializing write operations.
    - [ ] 8.3: Implement `async def clone_repo(repo_url: str, clone_dir: str, pat: str) -> None`. If `clone_dir` already exists, do a pull instead of cloning. Use `asyncio.to_thread` to wrap the synchronous GitPython calls. Inject the PAT into the HTTPS URL for authentication.
    - [ ] 8.4: Implement `async def pull_repo(clone_dir: str) -> None`. Open the existing repo, pull from origin. Wrap in `asyncio.to_thread`.
    - [ ] 8.5: Implement `async def commit_and_push(clone_dir: str, message: str) -> None`. Stage all changes (`git add -A`), commit with the given message, push to origin. Acquire the `asyncio.Lock` before writing. Wrap in `asyncio.to_thread`.
    - [ ] 8.6: Run `make test` — all `test_git_service.py` tests pass.

---

## Phase 4 — Backend: Gherkin Parser/Serializer

**Goal:** Build a stateless service that converts between `.feature` file text and Pydantic models. No git or filesystem dependencies — pure text transformation.

### Task 9 — Gherkin service tests
* **ID:** 9 | **Dependencies:** 5
    - [ ] 9.1: Create `backend/tests/test_gherkin_service.py`. Write a test for `parse_feature(text: str) -> FeatureBody` with a simple feature containing one scenario and two steps (Given + Then). Assert the returned `FeatureBody` has the correct name, scenario name, and step keywords/text.
    - [ ] 9.2: Write a parse test for a feature with a description (multi-line text between `Feature:` and the first `Scenario:`). Assert `description` is captured.
    - [ ] 9.3: Write a parse test for a feature with multiple scenarios. Assert all scenarios and their steps are returned in order.
    - [ ] 9.4: Write a parse test for steps using all five keywords: Given, When, Then, And, But. Assert each keyword is correctly identified.
    - [ ] 9.5: Write a test for `serialize_feature(feature: FeatureBody) -> str` that takes a `FeatureBody` and asserts the output string is valid Gherkin with correct indentation: 2 spaces for `Scenario:`, 4 spaces for steps, blank line between scenarios, trailing newline.
    - [ ] 9.6: Write a round-trip test: parse a `.feature` string, then serialize the result, and assert the output matches the original input (after normalizing whitespace). This ensures parse and serialize are inverse operations.
    - [ ] 9.7: Write a test for parsing an empty feature (name only, no scenarios). Assert the `FeatureBody` has an empty `scenarios` list.
    - [ ] 9.8: Run `make test` — all gherkin service tests fail with `ImportError`.

### Task 10 — Gherkin service implementation
* **ID:** 10 | **Dependencies:** 9
    - [ ] 10.1: Create `backend/app/services/gherkin_service.py`. Implement `def parse_feature(text: str) -> FeatureBody`. Parse line-by-line: extract the `Feature:` name, collect description lines (between Feature and first Scenario), then for each `Scenario:` line collect its steps (lines starting with Given/When/Then/And/But after stripping whitespace).
    - [ ] 10.2: Implement `def serialize_feature(feature: FeatureBody) -> str`. Output `Feature: {name}`, then description lines (if present), then for each scenario: blank line, `  Scenario: {name}`, then each step as `    {keyword} {text}`. End with a trailing newline.
    - [ ] 10.3: Run `make test` — all `test_gherkin_service.py` tests pass.

---

## Phase 5 — Backend: File Service

**Goal:** Build the file management service that orchestrates CRUD operations on the repo's folder/file structure, delegates to Git Service for persistence and Gherkin Service for parsing/serialization.

### Task 11 — File service tests (tree & path validation)
* **ID:** 11 | **Dependencies:** 8, 10
    - [ ] 11.1: Create `backend/tests/test_file_service.py`. Write a test for `get_tree(clone_dir: str) -> list[FileTreeEntry]` using the `git_repo` fixture. Assert: (a) the tree contains the sample `.feature` file from the fixture, (b) `.git/` directory is excluded, (c) `glossary.md` files are excluded, (d) folders have `type="folder"` and files have `type="file"`.
    - [ ] 11.2: Write a test for `validate_path(path: str)` that asserts it accepts a simple relative path like `"my-folder/test.feature"` without raising, and raises `ValueError` for each of: `"../escape"`, `"/absolute/path"`, `"folder/../../etc/passwd"`, and `".git/config"`.
    - [ ] 11.3: Run `make test` — file service tests fail with `ImportError`.

### Task 12 — File service tests (CRUD operations)
* **ID:** 12 | **Dependencies:** 11
    - [ ] 12.1: Write a test for `create_folder(clone_dir: str, path: str)` that creates a folder, then asserts it appears in `get_tree()` and that a commit was pushed to the bare repo.
    - [ ] 12.2: Write a test for `create_file(clone_dir: str, path: str, feature: FeatureBody)` that creates a `.feature` file, then reads it back and asserts the content matches the input `FeatureBody`.
    - [ ] 12.3: Write a test for `get_file(clone_dir: str, path: str) -> FeatureFile` that reads an existing `.feature` file (from the fixture) and asserts the returned `FeatureFile` has the correct path and parsed feature content.
    - [ ] 12.4: Write a test for `update_file(clone_dir: str, path: str, feature: FeatureBody)` that updates an existing file, reads it back, and asserts the content reflects the update.
    - [ ] 12.5: Write a test for `rename_entry(clone_dir: str, path: str, new_name: str)` for both a file and a folder. Assert the old name is gone and the new name appears in `get_tree()`.
    - [ ] 12.6: Write a test for `delete_entry(clone_dir: str, path: str)` for both a file and a folder. Assert the entry is removed from `get_tree()` and a commit was pushed.
    - [ ] 12.7: Write a test that `get_file` raises an appropriate error (e.g., `FileNotFoundError`) for a non-existent path.
    - [ ] 12.8: Run `make test` — all new file service tests fail with `ImportError`.

### Task 13 — File service implementation
* **ID:** 13 | **Dependencies:** 12
    - [ ] 13.1: Create `backend/app/services/file_service.py`. Implement `def validate_path(path: str) -> None` — reject paths containing `..`, absolute paths (starting with `/`), and paths targeting `.git/`. Raise `ValueError` with a descriptive message.
    - [ ] 13.2: Implement `async def get_tree(clone_dir: str) -> list[FileTreeEntry]`. Walk the `initiatives/` directory recursively, build `FileTreeEntry` nodes. Exclude `.git/` and `glossary.md`. Paths in entries should be relative to `initiatives/`.
    - [ ] 13.3: Implement `async def get_file(clone_dir: str, path: str) -> FeatureFile`. Validate the path, read the file from `initiatives/{path}`, parse it with `gherkin_service.parse_feature()`, return a `FeatureFile`.
    - [ ] 13.4: Implement `async def create_folder(clone_dir: str, path: str) -> None`. Validate the path, create the directory under `initiatives/`, create a `.gitkeep` file so git tracks the empty folder, call `git_service.commit_and_push()`.
    - [ ] 13.5: Implement `async def create_file(clone_dir: str, path: str, feature: FeatureBody) -> None`. Validate the path, serialize the feature with `gherkin_service.serialize_feature()`, write to `initiatives/{path}`, call `git_service.commit_and_push()`.
    - [ ] 13.6: Implement `async def update_file(clone_dir: str, path: str, feature: FeatureBody) -> None`. Validate the path, ensure the file exists, serialize and overwrite, call `git_service.commit_and_push()`.
    - [ ] 13.7: Implement `async def rename_entry(clone_dir: str, path: str, new_name: str) -> None`. Validate both old and new paths, use `os.rename` under `initiatives/`, call `git_service.commit_and_push()`.
    - [ ] 13.8: Implement `async def delete_entry(clone_dir: str, path: str) -> None`. Validate the path, delete the file or folder (use `shutil.rmtree` for folders), call `git_service.commit_and_push()`.
    - [ ] 13.9: Run `make test` — all `test_file_service.py` tests pass.

---

## Phase 6 — Backend: REST API & App Wiring

**Goal:** Expose all file operations as HTTP endpoints and wire the app lifespan to clone the repo on startup. After this phase the entire backend is functional and testable end-to-end.

### Task 14 — Router integration tests
* **ID:** 14 | **Dependencies:** 13
    - [ ] 14.1: Create `backend/tests/test_features_router.py`. Set up an `async_client` fixture that creates an `httpx.AsyncClient` with `ASGITransport` against the FastAPI app, using the `git_repo` fixture for the test repo.
    - [ ] 14.2: Write a test for `GET /api/v1/features/tree` — assert `200` response and that the body is a list of `FileTreeEntry`-shaped objects containing the fixture's sample file.
    - [ ] 14.3: Write a test for `GET /api/v1/features/file/{path}` — assert `200` and the body contains a `path` and a `feature` object with name, scenarios, and steps matching the fixture file.
    - [ ] 14.4: Write a test for `GET /api/v1/features/file/{path}` with a non-existent path — assert `404`.
    - [ ] 14.5: Write a test for `POST /api/v1/features/folders` — send `{"path": "new-folder"}`, assert `201`, then `GET /tree` and confirm the folder appears.
    - [ ] 14.6: Write a test for `POST /api/v1/features/files` — send a path and a FeatureBody JSON, assert `201`, then `GET /file/{path}` and confirm the content matches.
    - [ ] 14.7: Write a test for `PUT /api/v1/features/file/{path}` — update an existing file's feature body, assert `200`, then `GET /file/{path}` and confirm the update.
    - [ ] 14.8: Write a test for `PATCH /api/v1/features/{path}/rename` — rename a file, assert `200`, then `GET /tree` and confirm old name gone, new name present.
    - [ ] 14.9: Write a test for `DELETE /api/v1/features/{path}` — delete a file, assert `200`, then `GET /tree` and confirm it's gone.
    - [ ] 14.10: Write a test for `POST /api/v1/features/sync` — assert `200` and that the tree is refreshed.
    - [ ] 14.11: Write a test for path traversal attack: `GET /api/v1/features/file/../../../etc/passwd` — assert `400`.
    - [ ] 14.12: Run `make test` — all router tests fail with `ImportError` (router not yet created).

### Task 15 — Features router implementation
* **ID:** 15 | **Dependencies:** 14
    - [ ] 15.1: Create `backend/app/api/v1/features.py`. Define `router = APIRouter(prefix="/features", tags=["features"])`.
    - [ ] 15.2: Create dependency injection helpers: a function that returns the `clone_dir` from settings (via `Depends(get_settings)`).
    - [ ] 15.3: Implement `GET /tree` — calls `file_service.get_tree(clone_dir)`, returns the list.
    - [ ] 15.4: Implement `GET /file/{path:path}` — calls `file_service.get_file(clone_dir, path)`. Return `404` if file not found, `400` if path is invalid.
    - [ ] 15.5: Implement `POST /folders` — accepts `FolderCreate`, calls `file_service.create_folder()`, returns `201`.
    - [ ] 15.6: Implement `POST /files` — accepts `FileCreate`, calls `file_service.create_file()`, returns `201`.
    - [ ] 15.7: Implement `PUT /file/{path:path}` — accepts `FeatureBody`, calls `file_service.update_file()`, returns `200`.
    - [ ] 15.8: Implement `PATCH /{path:path}/rename` — accepts `RenameRequest`, calls `file_service.rename_entry()`, returns `200`.
    - [ ] 15.9: Implement `DELETE /{path:path}` — calls `file_service.delete_entry()`, returns `200`.
    - [ ] 15.10: Implement `POST /sync` — calls `git_service.pull_repo(clone_dir)`, returns `200`.
    - [ ] 15.11: Add error handlers: catch `ValueError` from path validation → `400`, catch `FileNotFoundError` → `404`.
    - [ ] 15.12: Run `make test` — all router tests still fail (router not registered in main.py yet).

### Task 16 — Wire app lifespan and register router
* **ID:** 16 | **Dependencies:** 15
    - [ ] 16.1: In `backend/main.py`, import the features router and include it with `app.include_router(router, prefix="/api/v1")`.
    - [ ] 16.2: Implement the `lifespan` async context manager: on startup, call `git_service.clone_repo()` using settings from `get_settings()`. On shutdown, no special cleanup needed.
    - [ ] 16.3: Run `make test` — all backend tests pass (test_config, test_schemas, test_git_service, test_gherkin_service, test_file_service, test_features_router).

---

## Phase 7 — Frontend: Cleanup & Foundation

**Goal:** Remove template frontend code, set up types and API layer. After this phase the frontend compiles and the API service is ready for components to consume.

### Task 17 — Remove template frontend code
* **ID:** 17 | **Dependencies:** 16
    - [ ] 17.1: Delete `frontend/src/pages/HomePage.tsx`.
    - [ ] 17.2: Delete `frontend/src/services/itemApi.ts`.
    - [ ] 17.3: Clear `frontend/src/types/index.ts` to an empty file.
    - [ ] 17.4: Simplify `frontend/src/App.tsx` to render just a placeholder `<div>Gherkin Manager</div>` inside the `QueryClientProvider` and `BrowserRouter`. Remove the HomePage route.
    - [ ] 17.5: Verify the frontend compiles and renders the placeholder (`npm run dev` or `make server`).

### Task 18 — TypeScript types
* **ID:** 18 | **Dependencies:** 17
    - [ ] 18.1: In `frontend/src/types/index.ts`, define and export `Step` interface with `keyword: "Given" | "When" | "Then" | "And" | "But"` and `text: string`.
    - [ ] 18.2: Define and export `Scenario` with `name: string` and `steps: Step[]`.
    - [ ] 18.3: Define and export `FeatureBody` with `name: string`, `description?: string`, and `scenarios: Scenario[]`.
    - [ ] 18.4: Define and export `FeatureFile` with `path: string` and `feature: FeatureBody`.
    - [ ] 18.5: Define and export `FileTreeEntry` with `name: string`, `type: "file" | "folder"`, `path: string`, and `children?: FileTreeEntry[]`.
    - [ ] 18.6: Define and export `FolderCreate` with `path: string`, `FileCreate` with `path: string` and `feature: FeatureBody`, and `RenameRequest` with `new_name: string`.
    - [ ] 18.7: Verify the frontend compiles with `npm run build` (or `npx tsc --noEmit`).

### Task 19 — API service & React Query hooks
* **ID:** 19 | **Dependencies:** 18
    - [ ] 19.1: Verify `frontend/src/services/api.ts` exists with a generic `apiFetch` function. If needed, confirm it reads `VITE_API_URL` and provides typed GET/POST/PUT/PATCH/DELETE helpers.
    - [ ] 19.2: Create `frontend/src/services/featureApi.ts`. Implement plain API functions: `getTree()`, `getFile(path)`, `createFolder(data)`, `createFile(data)`, `updateFile(path, feature)`, `renameEntry(path, data)`, `deleteEntry(path)`, `syncRepo()`. Each calls `apiFetch` with the correct method and URL.
    - [ ] 19.3: Implement `useFileTree()` — `useQuery` with key `["features", "tree"]`, calls `getTree()`.
    - [ ] 19.4: Implement `useFeatureFile(path: string | null)` — `useQuery` with key `["features", "file", path]`, calls `getFile(path!)`, `enabled: !!path`.
    - [ ] 19.5: Implement `useCreateFolder()` — `useMutation` that calls `createFolder()`, on success invalidates `["features", "tree"]`.
    - [ ] 19.6: Implement `useCreateFile()` — `useMutation` that calls `createFile()`, on success invalidates `["features", "tree"]`.
    - [ ] 19.7: Implement `useUpdateFile()` — `useMutation` that calls `updateFile()`, on success invalidates `["features", "tree"]` and `["features", "file"]` queries.
    - [ ] 19.8: Implement `useRenameEntry()` — `useMutation` that calls `renameEntry()`, on success invalidates `["features", "tree"]`.
    - [ ] 19.9: Implement `useDeleteEntry()` — `useMutation` that calls `deleteEntry()`, on success invalidates `["features", "tree"]`.
    - [ ] 19.10: Implement `useSyncRepo()` — `useMutation` that calls `syncRepo()`, on success invalidates all `["features"]` queries.
    - [ ] 19.11: Verify the frontend compiles.

### Task 20 — Utility & reusable UI setup
* **ID:** 20 | **Dependencies:** 17
    - [ ] 20.1: Create `frontend/src/lib/utils.ts` with the `cn()` conditional class helper: `export function cn(...classes: (string | undefined | false | null)[]): string { return classes.filter(Boolean).join(" "); }`.
    - [ ] 20.2: Verify the existing `frontend/src/components/ui/Button.tsx` component works or update it to use `cn()` for conditional styling.
    - [ ] 20.3: Verify the frontend compiles.

---

## Phase 8 — Frontend: Two-Panel Layout & File Tree

**Goal:** Build the app shell (sidebar + editor panel) and the file tree. Users can browse folders and select files. The editor panel shows a placeholder for the selected file.

### Task 21 — App layout
* **ID:** 21 | **Dependencies:** 19, 20
    - [ ] 21.1: In `frontend/src/App.tsx`, replace the placeholder with a two-panel layout: a left sidebar (fixed-width, e.g., `w-80`) and a right main panel (`flex-1`). Use flexbox. The sidebar renders the `FileTree` component (to be built). The main panel renders either the `FeatureEditor` or an empty-state message ("Select a file to edit"). Manage `selectedPath: string | null` as state in App.
    - [ ] 21.2: Pass `selectedPath` and `onSelectFile` callback as props to `FileTree`. Pass `selectedPath` as a prop to the editor panel area.
    - [ ] 21.3: Verify the layout renders correctly with placeholder components (just divs with text).

### Task 22 — FileTree component
* **ID:** 22 | **Dependencies:** 21
    - [ ] 22.1: Create `frontend/src/components/features/FileTree/FileTree.tsx`. It calls `useFileTree()` to fetch the tree data. While loading, show a "Loading..." indicator. On error, show an error message. On success, render a list of `TreeNode` components for each top-level entry.
    - [ ] 22.2: Add a header area at the top of the FileTree with "New Folder" and "New File" buttons (non-functional for now — just rendered) and a "Sync" button.
    - [ ] 22.3: Accept `selectedPath` and `onSelectFile` as props and pass them down to `TreeNode`.

### Task 23 — TreeNode component
* **ID:** 23 | **Dependencies:** 22
    - [ ] 23.1: Create `frontend/src/components/features/FileTree/TreeNode.tsx`. Accept a `FileTreeEntry`, `selectedPath`, and `onSelectFile` as props.
    - [ ] 23.2: For folder entries: render the folder name with an expand/collapse toggle (e.g., a chevron icon or `▸`/`▾` character). Use local `useState<boolean>` for `isExpanded`. When expanded, recursively render children as `TreeNode` components.
    - [ ] 23.3: For file entries: render the file name. On click, call `onSelectFile(entry.path)`. Highlight the node if `entry.path === selectedPath` (e.g., background color change).
    - [ ] 23.4: Add indentation based on nesting depth (pass a `depth` prop, use `paddingLeft`).
    - [ ] 23.5: Verify the tree renders correctly with the backend running (start both frontend and backend with `make server`, navigate the file tree).

---

## Phase 9 — Frontend: Structured Form Editor

**Goal:** Build the FeatureEditor, ScenarioEditor, and StepEditor. Users can view and edit feature file content through the guided form and save changes.

### Task 24 — StepEditor component
* **ID:** 24 | **Dependencies:** 21
    - [ ] 24.1: Create `frontend/src/components/features/Editor/StepEditor.tsx`. Accept props: `step: Step`, `onChange: (step: Step) => void`, `onRemove: () => void`.
    - [ ] 24.2: Render a keyword `<select>` dropdown with options Given, When, Then, And, But. Bind to `step.keyword`, call `onChange` with updated step on change.
    - [ ] 24.3: Render a text `<input>` for `step.text`. Bind and call `onChange` on change.
    - [ ] 24.4: Render a "Remove" button that calls `onRemove`.
    - [ ] 24.5: Style with Tailwind: horizontal layout (flex row), keyword dropdown has a fixed width, text input fills remaining space.

### Task 25 — ScenarioEditor component
* **ID:** 25 | **Dependencies:** 24
    - [ ] 25.1: Create `frontend/src/components/features/Editor/ScenarioEditor.tsx`. Accept props: `scenario: Scenario`, `onChange: (scenario: Scenario) => void`, `onRemove: () => void`.
    - [ ] 25.2: Render a text `<input>` for `scenario.name`. Bind and call `onChange` on change.
    - [ ] 25.3: Render a list of `StepEditor` components for each step. Pass `onChange` and `onRemove` handlers that update/remove the specific step in the `scenario.steps` array and propagate via `onChange`.
    - [ ] 25.4: Render an "Add Step" button that appends a new default step (`{ keyword: "Given", text: "" }`) to the steps array.
    - [ ] 25.5: Render a "Remove Scenario" button that calls `onRemove`.
    - [ ] 25.6: Style with Tailwind: card-like container with border, padding, and visual separation between steps.

### Task 26 — FeatureEditor component
* **ID:** 26 | **Dependencies:** 25
    - [ ] 26.1: Create `frontend/src/components/features/Editor/FeatureEditor.tsx`. Accept props: `path: string`. Call `useFeatureFile(path)` to fetch the file content. While loading, show a loading indicator. On error, show an error message.
    - [ ] 26.2: Initialize local form state from the fetched `FeatureBody` using `useState`. Reset form state when the fetched data changes (use `useEffect` keyed on the query data).
    - [ ] 26.3: Render a text `<input>` for `feature.name` and a `<textarea>` for `feature.description`.
    - [ ] 26.4: Render a list of `ScenarioEditor` components. Pass handlers that update the specific scenario in the local state's `scenarios` array.
    - [ ] 26.5: Render an "Add Scenario" button that appends a new default scenario (`{ name: "", steps: [{ keyword: "Given", text: "" }] }`).
    - [ ] 26.6: Render a "Save" button. On click, call the `useUpdateFile()` mutation with the current path and the local form state.
    - [ ] 26.7: Wire the FeatureEditor into the App layout: when `selectedPath` is set, render `<FeatureEditor path={selectedPath} />` in the right panel.
    - [ ] 26.8: Verify end-to-end: start backend + frontend, select a file in the tree, see the form populated, edit a field, click Save, verify the change persists (refresh the page and see the updated content).

---

## Phase 10 — Frontend: File/Folder CRUD Operations

**Goal:** Users can create new folders and files, rename entries, and delete entries from the tree UI.

### Task 27 — Modal and ConfirmDialog UI components
* **ID:** 27 | **Dependencies:** 20
    - [ ] 27.1: Create `frontend/src/components/ui/Modal.tsx`. Accept props: `isOpen: boolean`, `onClose: () => void`, `title: string`, `children: ReactNode`. Render an overlay + centered panel when open. Close on overlay click and Escape key.
    - [ ] 27.2: Create `frontend/src/components/ui/ConfirmDialog.tsx`. Accept props: `isOpen: boolean`, `onClose: () => void`, `onConfirm: () => void`, `title: string`, `message: string`. Uses Modal internally. Renders the message with "Cancel" and "Confirm" (danger-styled) buttons.
    - [ ] 27.3: Verify both components render correctly with test props.

### Task 28 — Create folder and file
* **ID:** 28 | **Dependencies:** 22, 27
    - [ ] 28.1: In `FileTree.tsx`, wire the "New Folder" button: on click, open a Modal with a text input for the folder path/name. On submit, call `useCreateFolder()` mutation. On success, close the modal (the tree auto-refreshes via query invalidation).
    - [ ] 28.2: Wire the "New File" button similarly: modal with inputs for the file path and initial feature name. On submit, call `useCreateFile()` with a `FileCreate` payload containing the path and a minimal `FeatureBody` (name from input, empty scenarios).
    - [ ] 28.3: Add basic validation: prevent empty names, ensure `.feature` extension for files.
    - [ ] 28.4: Verify end-to-end: create a folder, see it in the tree. Create a file, see it in the tree, click it, see the editor populated with the initial content.

### Task 29 — TreeActions component (rename & delete)
* **ID:** 29 | **Dependencies:** 28
    - [ ] 29.1: Create `frontend/src/components/features/FileTree/TreeActions.tsx`. Accept props: `entry: FileTreeEntry`, `onRename: (path: string, newName: string) => void`, `onDelete: (path: string) => void`. Render small "Rename" and "Delete" icon buttons (or text buttons).
    - [ ] 29.2: Integrate TreeActions into TreeNode: render the actions on hover or always visible next to each node name.

### Task 30 — Rename functionality
* **ID:** 30 | **Dependencies:** 29
    - [ ] 30.1: In `TreeNode`, when the user clicks "Rename" via TreeActions: switch the node's name display to an inline `<input>` pre-filled with the current name. On Enter or blur, call `useRenameEntry()` mutation with the entry's path and the new name. On Escape, cancel.
    - [ ] 30.2: Handle the case where the renamed file is currently selected in the editor: update `selectedPath` to the new path after a successful rename.
    - [ ] 30.3: Verify end-to-end: rename a file, see the new name in the tree. Rename a folder, see the new name and verify children are still accessible.

### Task 31 — Delete functionality
* **ID:** 31 | **Dependencies:** 29
    - [ ] 31.1: In `TreeNode`, when the user clicks "Delete" via TreeActions: open a `ConfirmDialog` with a message like "Delete {name}? This cannot be undone."
    - [ ] 31.2: On confirm, call `useDeleteEntry()` mutation with the entry's path.
    - [ ] 31.3: If the deleted file was the currently selected file, clear `selectedPath` to deselect.
    - [ ] 31.4: Verify end-to-end: delete a file, confirm it disappears from the tree. Delete a folder, confirm it and its contents are removed.

---

## Phase 11 — Frontend: Sync & Polish

**Goal:** Add the sync feature, loading/error states, and final polish. After this phase the feature is complete.

### Task 32 — Sync button
* **ID:** 32 | **Dependencies:** 22
    - [ ] 32.1: In `FileTree.tsx`, wire the "Sync" button: on click, call `useSyncRepo()` mutation. While syncing, show a loading indicator on the button (disable it, change label to "Syncing...").
    - [ ] 32.2: On success, all `["features"]` queries are invalidated (already configured in the hook), so the tree and any open file refresh automatically.
    - [ ] 32.3: Verify end-to-end: make a change directly in the git repo (outside the app), click Sync, see the change reflected in the UI.

### Task 33 — Loading & error states
* **ID:** 33 | **Dependencies:** 26, 28, 30, 31, 32
    - [ ] 33.1: In `FeatureEditor`, show a loading skeleton or spinner while the file is being fetched. Show an error banner if the fetch fails.
    - [ ] 33.2: In `FileTree`, show a loading skeleton while the tree is being fetched. Show an error message if it fails.
    - [ ] 33.3: For all mutations (create, update, rename, delete, sync): disable the trigger button while the mutation is pending. Show a brief error message (inline or toast) if the mutation fails.
    - [ ] 33.4: Add an empty state to the editor panel: when no file is selected, show a friendly message like "Select a feature file from the sidebar to start editing".

### Task 34 — File/folder name validation
* **ID:** 34 | **Dependencies:** 28, 30
    - [ ] 34.1: In the "New Folder" modal, validate that the name is non-empty and contains only safe characters (alphanumeric, hyphens, underscores). Show an inline validation message if invalid.
    - [ ] 34.2: In the "New File" modal, validate the same rules for the file name, and ensure it ends with `.feature`.
    - [ ] 34.3: In the inline rename input, apply the same validation. Prevent submission if invalid.

### Task 35 — Final cleanup
* **ID:** 35 | **Dependencies:** 33, 34
    - [ ] 35.1: Remove any remaining unused template code (check for dead imports, unused components, stale references to items/dictionary).
    - [ ] 35.2: Verify `make build` succeeds (Docker build).
    - [ ] 35.3: Verify `make test` passes all backend tests.
    - [ ] 35.4: Verify `make server` starts both frontend and backend correctly.
    - [ ] 35.5: Perform a full manual walkthrough: browse tree → select file → edit → save → create folder → create file → rename → delete → sync.

---

## Dependency Graph

```
Phase 1 — Scaffolding
  Task 1  (cleanup)
  Task 2  (deps)           → Task 1
  Task 3  (config)         → Task 2

Phase 2 — Schemas
  Task 4  (schema tests)   → Task 3
  Task 5  (schema impl)    → Task 4

Phase 3 — Git Service
  Task 6  (fixtures)       → Task 5
  Task 7  (git tests)      → Task 6
  Task 8  (git impl)       → Task 7

Phase 4 — Gherkin Parser
  Task 9  (gherkin tests)  → Task 5
  Task 10 (gherkin impl)   → Task 9

Phase 5 — File Service
  Task 11 (tree tests)     → Task 8, Task 10
  Task 12 (CRUD tests)     → Task 11
  Task 13 (file impl)      → Task 12

Phase 6 — REST API
  Task 14 (router tests)   → Task 13
  Task 15 (router impl)    → Task 14
  Task 16 (wiring)         → Task 15

Phase 7 — Frontend Foundation
  Task 17 (FE cleanup)     → Task 16
  Task 18 (TS types)       → Task 17
  Task 19 (API hooks)      → Task 18
  Task 20 (utils/UI)       → Task 17

Phase 8 — File Tree UI
  Task 21 (layout)         → Task 19, Task 20
  Task 22 (FileTree)       → Task 21
  Task 23 (TreeNode)       → Task 22

Phase 9 — Editor UI
  Task 24 (StepEditor)     → Task 21
  Task 25 (ScenarioEditor) → Task 24
  Task 26 (FeatureEditor)  → Task 25

Phase 10 — CRUD UI
  Task 27 (Modal/Confirm)  → Task 20
  Task 28 (Create F/F)     → Task 22, Task 27
  Task 29 (TreeActions)    → Task 28
  Task 30 (Rename)         → Task 29
  Task 31 (Delete)         → Task 29

Phase 11 — Polish
  Task 32 (Sync)           → Task 22
  Task 33 (States)         → Task 26, Task 28, Task 30, Task 31, Task 32
  Task 34 (Validation)     → Task 28, Task 30
  Task 35 (Final)          → Task 33, Task 34
```

**Total: 35 tasks, 11 phases. No orphan tasks — every task depends on at least one predecessor (except Task 1) and feeds into at least one successor (except Task 35).**
