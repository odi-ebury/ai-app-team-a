## Tech Stack

- Python 3.14
- FastAPI
- SQLAlchemy 2.0 (async with aiosqlite)
- Pydantic v2 for request/response models
- SQLite database (file: `nopictin.db`)
- passlib[bcrypt] for password hashing (bcrypt must be <4.1 for passlib compatibility)
- python-jose for JWT tokens

## Project Structure

```
app/
├── api/
│   ├── v1/
│   │   ├── auth.py          # POST /register, POST /token
│   │   ├── users.py         # GET /me, PUT /me
│   │   ├── discovery.py     # GET /discovery
│   │   ├── likes.py         # POST /like/{target_id}
│   │   ├── matches.py       # GET /matches, DELETE /matches/{target_id}
│   │   └── __init__.py      # Collects all v1 routers
│   └── deps.py              # Shared dependencies (DbSession, CurrentUser)
├── models/
│   ├── user.py              # User ORM model
│   └── like.py              # Like ORM model (with unique constraint)
├── schemas/
│   ├── user.py              # UserCreate, UserUpdate, UserResponse, Token, TokenRequest
│   ├── like.py              # LikeRequest, LikeResponse
│   ├── match.py             # MatchResponse
│   └── discovery.py         # DiscoveryProfile
├── services/
│   ├── user_service.py      # User CRUD + authentication
│   ├── like_service.py      # Upsert like + match detection
│   ├── match_service.py     # Get matches + unmatch
│   └── discovery_service.py # Random profile with exclusions
├── core/
│   ├── config.py            # Settings via pydantic-settings (env prefix: NOPICTIN_)
│   ├── security.py          # JWT encode/decode, password hash/verify
│   └── database.py          # Async engine + session factory
└── main.py                  # FastAPI app with CORS + lifespan
```

## Architecture Rules

- **One router per domain.** `api/v1/likes.py` handles all like endpoints. Never put multiple unrelated domains in one router file.
- **Three-layer architecture:** Router -> Service -> Model. Routers validate input and call services. Services contain business logic and call the ORM. Never do ORM queries directly in router functions.
- **All route handlers are `async def`.** Use async natively with aiosqlite.
- **Dependency injection via `Depends()`.** Use `Annotated[type, Depends(...)]` for type-safe injection. See `DbSession` and `CurrentUser` in `deps.py`.
- **Pydantic models are the contract.** API consumers see Pydantic schemas, never SQLAlchemy models. Map with `model_validate()`.

## Coding Conventions

- Pydantic schema naming: `{Entity}Create`, `{Entity}Update`, `{Entity}Response`.
- Route function naming: verb first, noun second (`register`, `login`, `get_me`, `like_user`).
- Error responses: raise `HTTPException` with specific status codes and detail messages.
- Environment config: use `pydantic-settings` with `Settings` class. Access via `get_settings()`. Never use `os.getenv()`.

## Testing

- Framework: `pytest` + `pytest-asyncio` (auto mode)
- HTTP client: `httpx.AsyncClient` with `ASGITransport`
- Database: in-memory SQLite per test via `conftest.py` fixtures
- Test files mirror the modules they test: `test_user_service.py` tests `user_service.py`, `test_auth_api.py` tests `auth.py`
- Run tests: `./venv/bin/python -m pytest tests/ -v`
- All fixtures are in `tests/conftest.py`: `engine`, `db`, `client`, `user_alice`, `user_bob`, `user_charlie`, `auth_header()`

## Key Design Decisions

- Phone numbers are only exposed in the `GET /matches` response (`MatchResponse`), never in `UserResponse` or `DiscoveryProfile`.
- Discovery shows profiles the user has already liked/disliked (per PRD "fluid interactions" — users can change their mind).
- Discovery excludes only mutual matches.
- The Like model uses a unique constraint on `(user_id, target_id)` for upsert behavior.
- Unmatch is one-directional: only the current user's `is_like` is set to `false`, which breaks the mutual match for both sides.

## NEVER DO THIS

1. **Never use bcrypt >= 4.1 with passlib 1.7.4.** The API changed and breaks passlib's internal checks.
2. **Never do ORM queries in routers.** Routers call services, services call the ORM.
3. **Never return SQLAlchemy models from endpoints.** Always map to a Pydantic Response schema.
4. **Never hardcode connection strings or secrets.** Use environment variables via `pydantic-settings`.
5. **Never use synchronous database drivers in async code.**
