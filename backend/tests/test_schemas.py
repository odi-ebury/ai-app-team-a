import pytest
from pydantic import ValidationError

from app.schemas.feature import (
    FileCreate,
    FileTreeEntry,
    FeatureBody,
    FeatureFile,
    FolderCreate,
    RenameRequest,
    Scenario,
    Step,
)


def test_step_valid():
    step = Step(keyword="Given", text="a user exists")
    assert step.keyword == "Given"
    assert step.text == "a user exists"


def test_step_rejects_invalid_keyword():
    with pytest.raises(ValidationError):
        Step(keyword="Invalid", text="something")


def test_scenario():
    steps = [
        Step(keyword="Given", text="a user exists"),
        Step(keyword="When", text="they log in"),
        Step(keyword="Then", text="they see the dashboard"),
    ]
    scenario = Scenario(name="User login", steps=steps)
    assert scenario.name == "User login"
    assert len(scenario.steps) == 3
    assert scenario.steps[0].keyword == "Given"
    assert scenario.steps[2].text == "they see the dashboard"


def test_feature_body_with_description():
    feature = FeatureBody(
        name="Authentication",
        description="Handles user login flows",
        scenarios=[
            Scenario(
                name="Valid login",
                steps=[Step(keyword="Given", text="valid credentials")],
            )
        ],
    )
    assert feature.name == "Authentication"
    assert feature.description == "Handles user login flows"
    assert len(feature.scenarios) == 1


def test_feature_body_description_defaults_to_none():
    feature = FeatureBody(name="Empty feature", scenarios=[])
    assert feature.description is None


def test_feature_file():
    body = FeatureBody(name="My Feature", scenarios=[])
    ff = FeatureFile(path="folder/my.feature", feature=body)
    assert ff.path == "folder/my.feature"
    assert ff.feature.name == "My Feature"


def test_file_tree_entry_recursive():
    child = FileTreeEntry(name="login.feature", type="file", path="auth/login.feature")
    folder = FileTreeEntry(
        name="auth", type="folder", path="auth", children=[child]
    )
    assert folder.type == "folder"
    assert len(folder.children) == 1
    assert folder.children[0].name == "login.feature"
    assert folder.children[0].type == "file"


def test_file_tree_entry_children_default_none():
    entry = FileTreeEntry(name="test.feature", type="file", path="test.feature")
    assert entry.children is None


def test_folder_create():
    fc = FolderCreate(path="new-folder")
    assert fc.path == "new-folder"


def test_file_create():
    body = FeatureBody(name="New Feature", scenarios=[])
    fc = FileCreate(path="folder/new.feature", feature=body)
    assert fc.path == "folder/new.feature"
    assert fc.feature.name == "New Feature"


def test_rename_request():
    rr = RenameRequest(new_name="renamed.feature")
    assert rr.new_name == "renamed.feature"
