import os
import shutil
from pathlib import Path

from app.schemas.feature import FeatureBody, FeatureFile, FileTreeEntry
from app.services import gherkin_service, git_service

_EXCLUDED_NAMES = {".git", "glossary.md"}


def validate_path(path: str) -> None:
    if path.startswith("/"):
        raise ValueError(f"Absolute paths are not allowed: {path}")
    if ".." in path.split("/"):
        raise ValueError(f"Path traversal is not allowed: {path}")
    if path.startswith(".git") or "/.git" in path:
        raise ValueError(f"Access to .git is not allowed: {path}")


def _build_tree(base: Path, rel: Path | None = None) -> list[FileTreeEntry]:
    entries: list[FileTreeEntry] = []
    current = base if rel is None else base / rel

    for item in sorted(current.iterdir()):
        if item.name in _EXCLUDED_NAMES:
            continue

        item_rel = item.relative_to(base)

        if item.is_dir():
            children = _build_tree(base, item_rel)
            entries.append(
                FileTreeEntry(
                    name=item.name,
                    type="folder",
                    path=str(item_rel),
                    children=children,
                )
            )
        else:
            entries.append(
                FileTreeEntry(
                    name=item.name,
                    type="file",
                    path=str(item_rel),
                )
            )

    return entries


async def get_tree(clone_dir: str) -> list[FileTreeEntry]:
    initiatives = Path(clone_dir) / "initiatives"
    if not initiatives.exists():
        return []
    return _build_tree(initiatives)


async def get_file(clone_dir: str, path: str) -> FeatureFile:
    validate_path(path)
    file_path = Path(clone_dir) / "initiatives" / path
    if not file_path.is_file():
        raise FileNotFoundError(f"File not found: {path}")
    text = file_path.read_text()
    feature = gherkin_service.parse_feature(text)
    return FeatureFile(path=path, feature=feature)


async def create_folder(clone_dir: str, path: str) -> None:
    validate_path(path)
    folder_path = Path(clone_dir) / "initiatives" / path
    folder_path.mkdir(parents=True, exist_ok=True)
    (folder_path / ".gitkeep").touch()
    await git_service.commit_and_push(clone_dir, f"Create folder {path}")


async def create_file(clone_dir: str, path: str, feature: FeatureBody) -> None:
    validate_path(path)
    file_path = Path(clone_dir) / "initiatives" / path
    file_path.parent.mkdir(parents=True, exist_ok=True)
    text = gherkin_service.serialize_feature(feature)
    file_path.write_text(text)
    await git_service.commit_and_push(clone_dir, f"Create file {path}")


async def update_file(clone_dir: str, path: str, feature: FeatureBody) -> None:
    validate_path(path)
    file_path = Path(clone_dir) / "initiatives" / path
    if not file_path.is_file():
        raise FileNotFoundError(f"File not found: {path}")
    text = gherkin_service.serialize_feature(feature)
    file_path.write_text(text)
    await git_service.commit_and_push(clone_dir, f"Update file {path}")


async def rename_entry(clone_dir: str, path: str, new_name: str) -> None:
    validate_path(path)
    old_path = Path(clone_dir) / "initiatives" / path
    new_path = old_path.parent / new_name
    validate_path(str(new_path.relative_to(Path(clone_dir) / "initiatives")))
    os.rename(old_path, new_path)
    await git_service.commit_and_push(clone_dir, f"Rename {path} to {new_name}")


async def delete_entry(clone_dir: str, path: str) -> None:
    validate_path(path)
    target = Path(clone_dir) / "initiatives" / path
    if target.is_dir():
        shutil.rmtree(target)
    else:
        target.unlink()
    await git_service.commit_and_push(clone_dir, f"Delete {path}")
