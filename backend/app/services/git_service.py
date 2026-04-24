import asyncio
from pathlib import Path
from urllib.parse import urlparse, urlunparse

import git

_write_lock = asyncio.Lock()


def _inject_pat(repo_url: str, pat: str) -> str:
    if not pat:
        return repo_url
    parsed = urlparse(repo_url)
    if parsed.scheme in ("http", "https"):
        netloc = f"{pat}@{parsed.hostname}"
        if parsed.port:
            netloc += f":{parsed.port}"
        return urlunparse(parsed._replace(netloc=netloc))
    return repo_url


def _clone_sync(repo_url: str, clone_dir: str, pat: str) -> None:
    auth_url = _inject_pat(repo_url, pat)
    clone_path = Path(clone_dir)

    if clone_path.exists():
        repo = git.Repo(clone_dir)
        repo.remotes.origin.pull()
    else:
        git.Repo.clone_from(auth_url, clone_dir)


def _pull_sync(clone_dir: str) -> None:
    repo = git.Repo(clone_dir)
    repo.remotes.origin.pull()


def _commit_and_push_sync(clone_dir: str, message: str) -> None:
    repo = git.Repo(clone_dir)
    repo.git.add("-A")
    repo.index.commit(message, author=git.Actor("Gherkin Manager", "gherkin@manager.app"))
    repo.remotes.origin.push()


async def clone_repo(repo_url: str, clone_dir: str, pat: str) -> None:
    await asyncio.to_thread(_clone_sync, repo_url, clone_dir, pat)


async def pull_repo(clone_dir: str) -> None:
    await asyncio.to_thread(_pull_sync, clone_dir)


async def commit_and_push(clone_dir: str, message: str) -> None:
    async with _write_lock:
        await asyncio.to_thread(_commit_and_push_sync, clone_dir, message)
