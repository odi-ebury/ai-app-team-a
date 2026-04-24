import subprocess
from pathlib import Path

import pytest

from app.services.git_service import clone_repo, pull_repo, commit_and_push


def test_git_repo_fixture_works(git_repo):
    assert git_repo["bare_repo_path"].exists()
    assert git_repo["repo_url"].startswith("file://")


async def test_clone_repo(git_repo):
    clone_dir = git_repo["clone_dir"]
    repo_url = git_repo["repo_url"]

    await clone_repo(repo_url, str(clone_dir), pat="")

    assert clone_dir.exists()
    assert (clone_dir / "initiatives").is_dir()
    assert (clone_dir / "initiatives" / "sample.feature").is_file()


async def test_pull_repo(git_repo):
    clone_dir = git_repo["clone_dir"]
    repo_url = git_repo["repo_url"]

    await clone_repo(repo_url, str(clone_dir), pat="")

    second_clone = git_repo["clone_dir"].parent / "second_clone"
    subprocess.run(["git", "clone", str(git_repo["bare_repo_path"]), str(second_clone)], check=True, capture_output=True)
    (second_clone / "initiatives" / "new_file.feature").write_text("Feature: New\n")
    subprocess.run(["git", "add", "-A"], cwd=str(second_clone), check=True, capture_output=True)
    subprocess.run(
        ["git", "-c", "user.name=Test", "-c", "user.email=test@test.com", "commit", "-m", "Add new file"],
        cwd=str(second_clone),
        check=True,
        capture_output=True,
    )
    subprocess.run(["git", "push", "origin", "master"], cwd=str(second_clone), check=True, capture_output=True)

    await pull_repo(str(clone_dir))

    assert (clone_dir / "initiatives" / "new_file.feature").is_file()


async def test_commit_and_push(git_repo):
    clone_dir = git_repo["clone_dir"]
    repo_url = git_repo["repo_url"]
    bare_repo_path = git_repo["bare_repo_path"]

    await clone_repo(repo_url, str(clone_dir), pat="")

    (clone_dir / "initiatives" / "created.feature").write_text("Feature: Created\n")

    await commit_and_push(str(clone_dir), "Add created file")

    result = subprocess.run(
        ["git", "log", "--oneline"],
        cwd=str(bare_repo_path),
        check=True,
        capture_output=True,
        text=True,
    )
    assert "Add created file" in result.stdout


async def test_clone_repo_is_idempotent(git_repo):
    clone_dir = git_repo["clone_dir"]
    repo_url = git_repo["repo_url"]

    await clone_repo(repo_url, str(clone_dir), pat="")
    assert (clone_dir / "initiatives" / "sample.feature").is_file()

    await clone_repo(repo_url, str(clone_dir), pat="")
    assert (clone_dir / "initiatives" / "sample.feature").is_file()
