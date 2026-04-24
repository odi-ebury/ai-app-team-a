from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    github_repo_url: str
    github_pat: str
    clone_dir: str = "./repo_clone"

    model_config = SettingsConfigDict(env_prefix="APP_")


@lru_cache
def get_settings() -> Settings:
    return Settings()
