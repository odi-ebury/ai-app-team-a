from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.core.config import Settings, get_settings
from app.schemas.feature import (
    EmojiUpdate,
    FeatureBody,
    FeatureFile,
    FileCreate,
    FileTreeEntry,
    FolderCreate,
    RenameRequest,
)
from app.services import file_service, git_service

router = APIRouter(prefix="/features", tags=["features"])


def _get_clone_dir(settings: Annotated[Settings, Depends(get_settings)]) -> str:
    return settings.clone_dir


CloneDir = Annotated[str, Depends(_get_clone_dir)]


@router.get("/tree", response_model=list[FileTreeEntry])
async def get_tree(clone_dir: CloneDir):
    return await file_service.get_tree(clone_dir)


@router.get("/file/{path:path}", response_model=FeatureFile)
async def get_file(path: str, clone_dir: CloneDir):
    try:
        return await file_service.get_file(clone_dir, path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/folders", status_code=201)
async def create_folder(data: FolderCreate, clone_dir: CloneDir):
    try:
        await file_service.create_folder(clone_dir, data.path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True}


@router.post("/files", status_code=201)
async def create_file(data: FileCreate, clone_dir: CloneDir):
    try:
        await file_service.create_file(clone_dir, data.path, data.feature)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True}


@router.put("/file/{path:path}")
async def update_file(path: str, feature: FeatureBody, clone_dir: CloneDir):
    try:
        await file_service.update_file(clone_dir, path, feature)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"ok": True}


@router.patch("/{path:path}/emoji")
async def update_emoji(path: str, data: EmojiUpdate, clone_dir: CloneDir):
    try:
        await file_service.update_emoji(clone_dir, path, data.emoji)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"ok": True}


@router.patch("/{path:path}/rename")
async def rename_entry(path: str, data: RenameRequest, clone_dir: CloneDir):
    try:
        await file_service.rename_entry(clone_dir, path, data.new_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True}


@router.delete("/{path:path}")
async def delete_entry(path: str, clone_dir: CloneDir):
    try:
        await file_service.delete_entry(clone_dir, path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True}


@router.post("/sync")
async def sync_repo(clone_dir: CloneDir):
    await git_service.pull_repo(clone_dir)
    return {"ok": True}
