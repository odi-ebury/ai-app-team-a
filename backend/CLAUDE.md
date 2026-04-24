## Tech Stack

- Python 3.12+
- FastAPI
- Pydantic v2 for request/response models
- GitPython for git operations (clone, pull, commit, push)
- pydantic-settings for configuration
- Poetry for dependency management
- No database — git is the data store

## Project Structure

```
app/
├── api/
│   └── v1/
│       └── features.py           # All /api/v1/features/* endpoints
├── schemas/
│   └── feature.py                # Step, Scenario, FeatureBody, FeatureFile,
│                                 #   FileTreeEntry, FolderCreate, FileCreate,
│                                 #   RenameRequest
├── services/
│   ├── git_service.py            # Clone, pull, commit+push (asyncio.Lock)
│   ├── gherkin_service.py        # Parse .feature text → models, serialize models → text
│   └── file_service.py           # Tree listing, CRUD on folders/files, path validation
├── core/
│   └── config.py                 # Settings via pydantic-settings (env prefix: APP_)
└── main.py                       # FastAPI app with CORS + lifespan (clone repo on startup)
tests/
├── conftest.py                   # Local bare git repo fixtures (tmp_path)
├── test_features_router.py       # HTTP integration tests for all endpoints
├── test_gherkin_service.py       # Parse/serialize/round-trip tests
├── test_file_service.py          # Tree, CRUD, path-validation tests
└── test_git_service.py           # Clone, pull, commit+push tests
```

Key differences from template:
- No `models/` directory (no ORM — git is the data store)
- No `core/database.py` (no database at all)
- No `scripts/seed_db.py`
- Three services instead of one: `git_service.py`, `gherkin_service.py`, `file_service.py`
- Single router (`features.py`) instead of per-domain routers

## Architecture Rules

- **Single router for the features domain.** All endpoints live in `api/v1/features.py`.
- **Three-service architecture:** Router → FileService → GitService / GherkinService.
  - **Router** validates input and calls FileService.
  - **FileService** orchestrates CRUD operations, validates paths, delegates to GitService for persistence and GherkinService for parsing/serialization.
  - **GitService** manages the local clone: clone, pull, commit+push. Uses a single `asyncio.Lock` to serialize all git operations.
  - **GherkinService** is stateless: parse `.feature` text into Pydantic models, serialize Pydantic models back to `.feature` text.
- **All route handlers are `async def`.**
- **Pydantic models are the contract.** API consumers see Pydantic schemas only. The services work with Pydantic models internally.
- **Git operations are serialized.** The `asyncio.Lock` in GitService prevents concurrent push races. All operations that touch the local clone acquire this lock.
- **The app only manages contents inside the `initiatives/` folder.** The tree endpoint returns the contents of `initiatives/` as root nodes — the user never sees the `initiatives/` prefix itself. All paths in the API are relative to `initiatives/`.
- **`glossary.md` files are ignored.** The tree endpoint and file listing filter them out.
- **Path validation is mandatory.** FileService validates every path to prevent directory-traversal attacks (no `..`, no absolute paths, must stay within `initiatives/`).
- **Dependency injection via `Depends()`.** Use `Annotated[type, Depends(...)]` for type-safe injection of services into route handlers.

## Configuration

Settings are managed via `pydantic-settings` with the `APP_` prefix:

| Variable              | Description                              | Required |
|-----------------------|------------------------------------------|----------|
| `APP_GITHUB_REPO_URL` | HTTPS URL of the GitHub feature-file repo | Yes      |
| `APP_GITHUB_PAT`      | GitHub Personal Access Token              | Yes      |
| `APP_CLONE_DIR`       | Local directory for the cloned repo       | No (has default) |

Access settings via `get_settings()`. Never use `os.getenv()` directly.

## REST API Endpoints

All endpoints are under `/api/v1/features`:

| Method | Path                           | Purpose                        |
|--------|--------------------------------|--------------------------------|
| GET    | /api/v1/features/tree          | Full folder/file tree          |
| GET    | /api/v1/features/file/{path}   | Parsed feature file content    |
| POST   | /api/v1/features/folders       | Create a folder                |
| POST   | /api/v1/features/files         | Create a feature file          |
| PUT    | /api/v1/features/file/{path}   | Update feature file content    |
| PATCH  | /api/v1/features/{path}/rename | Rename a file or folder        |
| DELETE | /api/v1/features/{path}        | Delete a file or folder        |
| POST   | /api/v1/features/sync          | Force pull from remote         |

Paths in the URL are relative to the `initiatives/` folder. The `{path}` parameter uses FastAPI's path converter (`:path`).

## Pydantic Schemas

Defined in `app/schemas/feature.py`:

- **Step** — `keyword` (Given/When/Then/And/But) + `text`
- **Scenario** — `name` + `steps: list[Step]`
- **FeatureBody** — `name` + `description` (optional) + `scenarios: list[Scenario]`
- **FeatureFile** — `path` + `feature: FeatureBody` (returned by GET file, accepted by PUT file)
- **FileTreeEntry** — `name` + `type` ("file" | "folder") + `path` + `children: list[FileTreeEntry]` (recursive)
- **FolderCreate** — `path` (where to create the folder)
- **FileCreate** — `path` + `feature: FeatureBody` (initial content)
- **RenameRequest** — `new_name`

## Coding Conventions

- Pydantic schema naming: domain nouns (`Step`, `Scenario`, `FeatureBody`, `FileTreeEntry`). No `Create`/`Response` suffix convention — schemas are named for what they represent.
- Route function naming: verb first, noun second (`get_tree`, `get_file`, `create_folder`, `update_file`, `rename_entry`, `delete_entry`, `sync_repo`).
- Error responses: raise `HTTPException` with specific status codes and detail messages (404 for missing files/folders, 400 for invalid paths, 409 for conflicts).
- Environment config: use `pydantic-settings` with `Settings` class. Access via `get_settings()`. Never use `os.getenv()`.
- Service functions are plain `async def` functions (not classes). Import and call them directly.
- Gherkin serialization must produce deterministic output: consistent indentation (2 spaces for Scenario, 4 spaces for Steps), blank lines between scenarios, trailing newline.

## Testing

- Framework: `pytest` + `pytest-asyncio` (auto mode)
- HTTP client: `httpx.AsyncClient` with `ASGITransport`
- No database fixtures — tests use **local bare git repos** as fixtures instead

### Test Fixture Pattern

Tests use `tmp_path` to create a temporary bare git repo, clone it, populate it with an `initiatives/` folder and sample `.feature` files, then push. The app's settings are overridden to point at this temporary repo.

```python
# Simplified fixture pattern (see conftest.py for full implementation):
@pytest_asyncio.fixture
async def git_repo(tmp_path):
    bare = tmp_path / "remote.git"
    # 1. init --bare the remote
    # 2. clone to a working dir
    # 3. create initiatives/ with sample .feature files
    # 4. commit + push
    # 5. override app settings to point CLONE_DIR and REPO_URL at tmp_path paths
    yield repo_info
    # cleanup: restore original settings
```

### What to Test

- **Router tests** (`test_features_router.py`): Full HTTP round-trips — create folders/files, read tree, read file, update file, rename, delete, sync.
- **Gherkin service tests** (`test_gherkin_service.py`): Parse → model, model → serialize, round-trip (parse then serialize produces identical output).
- **File service tests** (`test_file_service.py`): Tree building, path validation (reject `..`, absolute paths), CRUD operations.
- **Git service tests** (`test_git_service.py`): Clone, pull, commit+push against local bare repo.

Run tests: `make test`

## NEVER DO THIS

1. **Never do git operations in routers.** Routers call FileService, FileService calls GitService. Never import GitPython in router files.
2. **Never bypass the asyncio.Lock for write operations.** All commits must go through GitService which holds the lock.
3. **Never hardcode repository URLs, PATs, or clone paths.** Use environment variables via `pydantic-settings`.
4. **Never allow paths outside `initiatives/`.** All user-supplied paths must be validated by FileService before any filesystem operation.
5. **Never use an external Gherkin parsing library.** The custom parser/serializer handles the supported subset (Feature, Scenario, Given/When/Then/And/But) — keep it simple and dependency-free.
6. **Never add a database.** Git is the only data store. No SQLAlchemy, no SQLite, no ORM.
7. **Never use synchronous git operations that block the event loop without wrapping in `run_in_executor`.** GitPython is synchronous — wrap calls appropriately or use `asyncio.to_thread`.
