import subprocess
from unittest.mock import patch

import pytest

from app.core.config import Settings, get_settings
from main import app


SAMPLE_FEATURE = """\
Feature: Sample feature
  A sample feature for testing

  Scenario: Sample scenario
    Given a precondition
    When an action is performed
    Then a result is expected
"""


@pytest.fixture
def override_settings():
    def _override(repo_url: str, clone_dir: str):
        test_settings = Settings(
            github_repo_url=repo_url,
            github_pat="",
            clone_dir=clone_dir,
        )
        return patch("app.core.config.get_settings", return_value=test_settings)

    return _override


@pytest.fixture
def git_repo(tmp_path, override_settings):
    bare_repo_path = tmp_path / "remote.git"
    clone_dir = tmp_path / "clone"
    work_dir = tmp_path / "setup_work"

    subprocess.run(["git", "init", "--bare", str(bare_repo_path)], check=True, capture_output=True)
    subprocess.run(["git", "clone", str(bare_repo_path), str(work_dir)], check=True, capture_output=True)

    initiatives = work_dir / "initiatives"
    initiatives.mkdir()
    (initiatives / "sample.feature").write_text(SAMPLE_FEATURE)

    subprocess.run(["git", "add", "-A"], cwd=str(work_dir), check=True, capture_output=True)
    subprocess.run(
        ["git", "-c", "user.name=Test", "-c", "user.email=test@test.com", "commit", "-m", "Initial commit"],
        cwd=str(work_dir),
        check=True,
        capture_output=True,
    )
    subprocess.run(["git", "push", "origin", "master"], cwd=str(work_dir), check=True, capture_output=True)

    repo_url = f"file://{bare_repo_path}"
    test_settings = Settings(
        github_repo_url=repo_url,
        github_pat="",
        clone_dir=str(clone_dir),
    )

    mock_ctx = override_settings(repo_url, str(clone_dir))
    app.dependency_overrides[get_settings] = lambda: test_settings

    with mock_ctx:
        yield {
            "bare_repo_path": bare_repo_path,
            "clone_dir": clone_dir,
            "repo_url": repo_url,
            "work_dir": work_dir,
        }

    app.dependency_overrides.clear()
