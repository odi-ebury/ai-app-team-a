from app.core.config import Settings


def test_settings_with_all_fields():
    settings = Settings(
        github_repo_url="https://github.com/org/repo.git",
        github_pat="ghp_test_token_123",
        clone_dir="/tmp/custom_clone",
    )
    assert settings.github_repo_url == "https://github.com/org/repo.git"
    assert settings.github_pat == "ghp_test_token_123"
    assert settings.clone_dir == "/tmp/custom_clone"


def test_settings_clone_dir_has_default():
    settings = Settings(
        github_repo_url="https://github.com/org/repo.git",
        github_pat="ghp_test_token_123",
    )
    assert settings.clone_dir == "./repo_clone"
