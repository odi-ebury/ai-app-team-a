from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.features import router as features_router
from app.core.config import get_settings
from app.services import git_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    await git_service.clone_repo(settings.github_repo_url, settings.clone_dir, settings.github_pat)
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(features_router, prefix="/api/v1")


@app.get("/")
async def read_root():
    return {"message": "Hello, world!"}


@app.get("/health")
async def health():
    return {"status": "ok"}
