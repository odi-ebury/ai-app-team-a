# PRD: Gherkin Requirements Manager

## 1. Feature Overview

A web-based tool for cross-functional teams (product managers, QA engineers, developers) to manage product requirements stored as Gherkin feature files. The tool provides a structured form interface for creating and editing requirements — no raw Gherkin syntax knowledge required — making it accessible to non-technical team members.

All requirements are persisted as `.feature` files in a dedicated GitHub repository. The application acts as a visual layer over git: it clones the repo, renders its contents in a browsable UI, and commits changes directly to the main branch on every save. There is no database — **git is the data store**.

No user authentication is required. The tool is designed for trusted internal teams with open access.

## 2. Core Requirements

- **Gherkin as source of truth.** All product requirements are stored as `.feature` files following the Gherkin format (Feature, Scenario, Given, When, Then, And, But).
- **Git-backed persistence.** Feature files live in a separate, dedicated GitHub repository. The app clones this repo locally, reads/writes to the clone, and pushes changes back to the remote.
- **No authentication.** Open access — anyone with the URL can view and edit. Suitable for internal trusted teams.
- **Direct commits.** Changes are committed directly to the main branch. No branching, no pull requests, no review workflow.
- **Last write wins.** No conflict resolution — the most recent save overwrites any concurrent changes.
- **Form-enforced validation.** The structured form guarantees valid Gherkin output by construction. No additional backend syntax validation is needed.
- **Core Gherkin subset only.** The tool supports: Feature, Scenario, Given, When, Then, And, But. Advanced constructs (Background, Scenario Outline, Examples, Tags, Data Tables, Doc Strings) are out of scope.

## 3. Core Features

### 3.1 Folder & File Browsing
Users navigate the repository contents through a file-manager-like folder tree. Folders expand/collapse on click. Feature files are clickable to open in the editor panel.

### 3.2 Folder & File Management
Users can **create**, **rename**, and **delete** both folders and feature files directly from the UI. Moving files between folders is not supported.

### 3.3 Structured Gherkin Editor
A guided form with dedicated fields for:
- **Feature name** — text input
- **Feature description** — textarea (optional)
- **Scenarios** — ordered list, each containing:
  - **Scenario name** — text input
  - **Steps** — ordered list, each with:
    - **Keyword** — dropdown (Given, When, Then, And, But)
    - **Step text** — text input

Users add/remove scenarios and steps via buttons. Saving triggers a commit and push to the remote repository.

### 3.4 Sync
A manual "Sync" action to force-pull the latest state from the remote repository, in case changes were made outside the tool.

## 4. Core Components

### A. Git Service (Backend)
Manages the local clone of the remote Gherkin repository.
- **Clone** the remote repo on application startup (or first access).
- **Pull** latest changes before reads to stay current.
- **Commit & push** after every write operation.
- Authenticates via a **GitHub Personal Access Token** configured as an environment variable.
- Uses an **asyncio lock** to serialize write operations and prevent concurrent push races.

### B. Gherkin Parser/Serializer (Backend)
Converts between `.feature` file text and structured JSON objects.
- **Parser**: reads `.feature` files line-by-line, extracts Feature name, description, Scenarios, and Steps into structured data.
- **Serializer**: converts structured data back into properly formatted `.feature` file text.
- Lightweight, custom implementation — no external Gherkin library needed for the core subset.

### C. File Management Service (Backend)
Provides CRUD operations on the repository's folder and file structure.
- Builds a recursive file tree (excluding `.git/`).
- Creates, renames, and deletes folders and `.feature` files.
- Validates all paths to prevent directory traversal attacks.
- Delegates to the Git Service for persistence and to the Gherkin Service for parsing/serialization.

### D. REST API (Backend)
Exposes the following endpoints:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/features/tree` | Full folder/file tree |
| GET | `/api/v1/features/file/{path}` | Parsed feature file content |
| POST | `/api/v1/features/folders` | Create a folder |
| POST | `/api/v1/features/files` | Create a feature file |
| PUT | `/api/v1/features/file/{path}` | Update feature file content |
| PATCH | `/api/v1/features/{path}/rename` | Rename a file or folder |
| DELETE | `/api/v1/features/{path}` | Delete a file or folder |
| POST | `/api/v1/features/sync` | Force pull from remote |

### E. Folder Tree UI (Frontend)
A sidebar component rendering the repository structure as an expandable/collapsible tree. Each node supports contextual actions (rename, delete). Top-level buttons allow creating new folders and files.

### F. Structured Form Editor (Frontend)
A form-based editor composed of nested components:
- **FeatureEditor** — top-level form with feature name, description, scenario list, and save button.
- **ScenarioEditor** — individual scenario with name and step list.
- **StepEditor** — individual step with keyword dropdown and text input.

## 5. App / User Flow

1. **Launch.** User opens the app in a browser. The backend clones (or pulls) the latest state from the GitHub repository.
2. **Browse.** The left sidebar displays the folder/file tree. User clicks folders to expand and navigates to the desired area.
3. **Select.** User clicks a `.feature` file. The right panel loads the structured form editor populated with the file's content (feature name, scenarios, steps).
4. **Edit.** User modifies the feature name, adds/removes scenarios, adds/removes steps, changes keywords or step text.
5. **Save.** User clicks "Save". The backend serializes the form data to Gherkin format, writes the `.feature` file, and commits + pushes to the remote repo.
6. **Create.** User clicks "New Folder" or "New File" in the sidebar. A modal prompts for a name (and initial feature name for files). The backend creates the entry and commits.
7. **Rename.** User triggers rename on a tree node. An inline text input appears. On confirm, the backend renames the entry and commits.
8. **Delete.** User triggers delete on a tree node. A confirmation dialog appears. On confirm, the backend deletes the entry and commits.
9. **Sync.** User clicks "Sync" to force-pull the latest remote state, refreshing the tree and any open file.

## 6. Techstack

- **Frontend:** React 19 (TypeScript), Vite 8, Tailwind CSS 4, TanStack React Query 5, React Router 7
- **Backend:** FastAPI (Python 3.12+), Pydantic v2, GitPython
- **Data Store:** Git repository (GitHub) — no database
- **Authentication (to GitHub):** Personal Access Token via environment variable
- **Containerization:** Docker, docker-compose
- **Build & Run:** Makefile (`make build`, `make server`, `make test`)
- **Testing:** pytest + pytest-asyncio + httpx (backend), local bare git repos as test fixtures

## 7. Implementation Plan

### Phase 1 — Backend: Configuration & Git Service
Set up the git integration layer. Add configuration settings for the repo URL, PAT, and local clone directory. Build the Git Service with clone, pull, and commit+push operations. Add `GitPython` dependency. Update Docker to include `git`. Write tests against local bare git repos.

### Phase 2 — Backend: Gherkin Parser/Serializer
Build the Pydantic schemas (Step, Scenario, FeatureBody, FileTreeEntry, etc.) and the Gherkin parser/serializer service. The parser reads `.feature` files into structured objects; the serializer converts them back. Write parse, serialize, and round-trip tests.

### Phase 3 — Backend: File Service & REST API
Build the file management service (tree listing, CRUD operations with path validation) and the REST API endpoints. Wire up the lifespan handler to clone the repo on startup. Replace the template's SQLAlchemy-based infrastructure. Write HTTP integration tests using local bare git repo fixtures.

### Phase 4 — Frontend: File Tree & Navigation
Build the folder tree sidebar and two-panel page layout. Create the API service layer with React Query hooks. Users can browse folders, expand/collapse, and select files. Replace the template's HomePage and item API.

### Phase 5 — Frontend: Structured Form Editor
Build the FeatureEditor, ScenarioEditor, and StepEditor form components. Wire up to the update mutation so edits are saved and committed. Users can view and edit feature file content through the guided form.

### Phase 6 — Frontend: File/Folder CRUD Operations
Add create, rename, and delete capabilities to the folder tree UI. Build modal dialogs for creation and confirmation dialogs for deletion. Inline rename editing on tree nodes.

### Phase 7 — Polish & Cleanup
Add loading states, error handling (toasts for failed git operations), empty states, file/folder name validation. Add the Sync button. Clean up unused template code. Update documentation.
