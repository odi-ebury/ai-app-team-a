import subprocess

import pytest

from app.schemas.feature import FeatureBody, Scenario, Step
from app.services.file_service import (
    create_file,
    create_folder,
    delete_entry,
    get_file,
    get_tree,
    rename_entry,
    update_file,
    validate_path,
)
from app.services.git_service import clone_repo


# --- Task 11: tree & path validation ---


async def test_get_tree(git_repo):
    clone_dir = str(git_repo["clone_dir"])
    await clone_repo(git_repo["repo_url"], clone_dir, pat="")

    tree = await get_tree(clone_dir)

    names = [e.name for e in tree]
    assert "sample.feature" in names

    all_names = _collect_names(tree)
    assert ".git" not in all_names

    for entry in tree:
        if entry.name == "sample.feature":
            assert entry.type == "file"


async def test_get_tree_excludes_glossary(git_repo):
    clone_dir = str(git_repo["clone_dir"])
    await clone_repo(git_repo["repo_url"], clone_dir, pat="")

    initiatives = git_repo["clone_dir"] / "initiatives"
    (initiatives / "glossary.md").write_text("# Glossary\n")

    tree = await get_tree(clone_dir)
    all_names = _collect_names(tree)
    assert "glossary.md" not in all_names


def test_validate_path_accepts_valid():
    validate_path("my-folder/test.feature")
    validate_path("simple.feature")
    validate_path("a/b/c/deep.feature")


def test_validate_path_rejects_traversal():
    with pytest.raises(ValueError):
        validate_path("../escape")


def test_validate_path_rejects_absolute():
    with pytest.raises(ValueError):
        validate_path("/absolute/path")


def test_validate_path_rejects_nested_traversal():
    with pytest.raises(ValueError):
        validate_path("folder/../../etc/passwd")


def test_validate_path_rejects_git():
    with pytest.raises(ValueError):
        validate_path(".git/config")


# --- Task 12: CRUD operations ---


async def test_create_folder(git_repo):
    clone_dir = str(git_repo["clone_dir"])
    await clone_repo(git_repo["repo_url"], clone_dir, pat="")

    await create_folder(clone_dir, "new-folder")

    tree = await get_tree(clone_dir)
    folder_names = [e.name for e in tree if e.type == "folder"]
    assert "new-folder" in folder_names

    result = subprocess.run(
        ["git", "log", "--oneline"],
        cwd=str(git_repo["bare_repo_path"]),
        check=True,
        capture_output=True,
        text=True,
    )
    assert len(result.stdout.strip().splitlines()) >= 2


async def test_create_file(git_repo):
    clone_dir = str(git_repo["clone_dir"])
    await clone_repo(git_repo["repo_url"], clone_dir, pat="")

    feature = FeatureBody(
        name="New Feature",
        scenarios=[
            Scenario(
                name="Test scenario",
                steps=[Step(keyword="Given", text="something")],
            )
        ],
    )
    await create_file(clone_dir, "new.feature", feature)

    result = await get_file(clone_dir, "new.feature")
    assert result.path == "new.feature"
    assert result.feature.name == "New Feature"
    assert len(result.feature.scenarios) == 1


async def test_get_file(git_repo):
    clone_dir = str(git_repo["clone_dir"])
    await clone_repo(git_repo["repo_url"], clone_dir, pat="")

    result = await get_file(clone_dir, "sample.feature")

    assert result.path == "sample.feature"
    assert result.feature.name == "Sample feature"
    assert result.feature.description == "A sample feature for testing"
    assert len(result.feature.scenarios) == 1
    assert result.feature.scenarios[0].name == "Sample scenario"


async def test_update_file(git_repo):
    clone_dir = str(git_repo["clone_dir"])
    await clone_repo(git_repo["repo_url"], clone_dir, pat="")

    updated = FeatureBody(
        name="Updated feature",
        scenarios=[
            Scenario(
                name="Updated scenario",
                steps=[Step(keyword="Then", text="updated result")],
            )
        ],
    )
    await update_file(clone_dir, "sample.feature", updated)

    result = await get_file(clone_dir, "sample.feature")
    assert result.feature.name == "Updated feature"
    assert result.feature.scenarios[0].name == "Updated scenario"


async def test_rename_file(git_repo):
    clone_dir = str(git_repo["clone_dir"])
    await clone_repo(git_repo["repo_url"], clone_dir, pat="")

    await rename_entry(clone_dir, "sample.feature", "renamed.feature")

    tree = await get_tree(clone_dir)
    names = _collect_names(tree)
    assert "sample.feature" not in names
    assert "renamed.feature" in names


async def test_rename_folder(git_repo):
    clone_dir = str(git_repo["clone_dir"])
    await clone_repo(git_repo["repo_url"], clone_dir, pat="")

    await create_folder(clone_dir, "old-folder")
    await rename_entry(clone_dir, "old-folder", "new-folder")

    tree = await get_tree(clone_dir)
    names = _collect_names(tree)
    assert "old-folder" not in names
    assert "new-folder" in names


async def test_delete_file(git_repo):
    clone_dir = str(git_repo["clone_dir"])
    await clone_repo(git_repo["repo_url"], clone_dir, pat="")

    await delete_entry(clone_dir, "sample.feature")

    tree = await get_tree(clone_dir)
    names = _collect_names(tree)
    assert "sample.feature" not in names

    result = subprocess.run(
        ["git", "log", "--oneline"],
        cwd=str(git_repo["bare_repo_path"]),
        check=True,
        capture_output=True,
        text=True,
    )
    assert len(result.stdout.strip().splitlines()) >= 2


async def test_delete_folder(git_repo):
    clone_dir = str(git_repo["clone_dir"])
    await clone_repo(git_repo["repo_url"], clone_dir, pat="")

    await create_folder(clone_dir, "to-delete")
    await delete_entry(clone_dir, "to-delete")

    tree = await get_tree(clone_dir)
    names = _collect_names(tree)
    assert "to-delete" not in names


async def test_get_file_not_found(git_repo):
    clone_dir = str(git_repo["clone_dir"])
    await clone_repo(git_repo["repo_url"], clone_dir, pat="")

    with pytest.raises(FileNotFoundError):
        await get_file(clone_dir, "nonexistent.feature")


def _collect_names(entries) -> list[str]:
    names = []
    for e in entries:
        names.append(e.name)
        if e.children:
            names.extend(_collect_names(e.children))
    return names
