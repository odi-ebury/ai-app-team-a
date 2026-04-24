from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class Step(BaseModel):
    keyword: Literal["Given", "When", "Then", "And", "But"]
    text: str


class Scenario(BaseModel):
    name: str
    steps: list[Step]


class FeatureBody(BaseModel):
    name: str
    description: str | None = None
    scenarios: list[Scenario]


class FeatureFile(BaseModel):
    path: str
    feature: FeatureBody


class FileTreeEntry(BaseModel):
    name: str
    type: Literal["file", "folder"]
    path: str
    children: list[FileTreeEntry] | None = None
    feature_name: str | None = None
    emoji: str | None = None


class FolderCreate(BaseModel):
    path: str


class FileCreate(BaseModel):
    path: str
    feature: FeatureBody


class RenameRequest(BaseModel):
    new_name: str


class EmojiUpdate(BaseModel):
    emoji: str
