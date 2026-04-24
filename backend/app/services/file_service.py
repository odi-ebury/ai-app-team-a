import json
import os
import shutil
from pathlib import Path

from app.schemas.feature import FeatureBody, FeatureFile, FileTreeEntry
from app.services import gherkin_service, git_service

_EXCLUDED_NAMES = {".git", ".gitkeep", ".meta.json", "glossary.md"}
_META_FILE = ".meta.json"


def validate_path(path: str) -> None:
    if path.startswith("/"):
        raise ValueError(f"Absolute paths are not allowed: {path}")
    if ".." in path.split("/"):
        raise ValueError(f"Path traversal is not allowed: {path}")
    if path.startswith(".git") or "/.git" in path:
        raise ValueError(f"Access to .git is not allowed: {path}")


def _read_meta(folder: Path) -> dict:
    meta_path = folder / _META_FILE
    if meta_path.is_file():
        try:
            return json.loads(meta_path.read_text())
        except Exception:
            pass
    return {}


def _write_meta(folder: Path, meta: dict) -> None:
    (folder / _META_FILE).write_text(json.dumps(meta))


def _build_tree(base: Path, rel: Path | None = None) -> list[FileTreeEntry]:
    entries: list[FileTreeEntry] = []
    current = base if rel is None else base / rel
    meta = _read_meta(current)
    order: list[str] = meta.get("order", [])

    items = [i for i in current.iterdir() if i.name not in _EXCLUDED_NAMES]

    order_index = {name: idx for idx, name in enumerate(order)}
    items.sort(key=lambda i: (order_index.get(i.name, len(order)), i.name))

    for item in items:
        item_rel = item.relative_to(base)

        if item.is_dir():
            children = _build_tree(base, item_rel)
            child_meta = _read_meta(item)
            entries.append(
                FileTreeEntry(
                    name=item.name,
                    type="folder",
                    path=str(item_rel),
                    children=children,
                    emoji=child_meta.get("emoji"),
                )
            )
        else:
            feature_name = None
            if item.suffix == ".feature":
                try:
                    parsed = gherkin_service.parse_feature(item.read_text())
                    feature_name = parsed.name
                except Exception:
                    pass
            entries.append(
                FileTreeEntry(
                    name=item.name,
                    type="file",
                    path=str(item_rel),
                    feature_name=feature_name,
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


async def update_emoji(clone_dir: str, path: str, emoji: str) -> None:
    validate_path(path)
    folder_path = Path(clone_dir) / "initiatives" / path
    if not folder_path.is_dir():
        raise FileNotFoundError(f"Folder not found: {path}")
    meta = _read_meta(folder_path)
    meta["emoji"] = emoji
    _write_meta(folder_path, meta)
    await git_service.commit_and_push(clone_dir, f"Update emoji for {path}")


async def reorder_children(
    clone_dir: str, parent_path: str | None, ordered_names: list[str]
) -> None:
    initiatives = Path(clone_dir) / "initiatives"
    if parent_path:
        validate_path(parent_path)
        folder = initiatives / parent_path
    else:
        folder = initiatives
    if not folder.is_dir():
        raise FileNotFoundError(
            f"Folder not found: {parent_path or 'initiatives'}"
        )
    meta = _read_meta(folder)
    meta["order"] = ordered_names
    _write_meta(folder, meta)
    label = parent_path or "root"
    await git_service.commit_and_push(clone_dir, f"Reorder children in {label}")


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
