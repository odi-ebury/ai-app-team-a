import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.services.git_service import clone_repo
from main import app


@pytest_asyncio.fixture
async def async_client(git_repo):
    await clone_repo(git_repo["repo_url"], str(git_repo["clone_dir"]), pat="")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


async def test_get_tree(async_client):
    resp = await async_client.get("/api/v1/features/tree")
    assert resp.status_code == 200
    body = resp.json()
    assert isinstance(body, list)
    names = [e["name"] for e in body]
    assert "sample.feature" in names


async def test_get_file(async_client):
    resp = await async_client.get("/api/v1/features/file/sample.feature")
    assert resp.status_code == 200
    body = resp.json()
    assert body["path"] == "sample.feature"
    assert body["feature"]["name"] == "Sample feature"
    assert len(body["feature"]["scenarios"]) == 1
    assert body["feature"]["scenarios"][0]["name"] == "Sample scenario"
    assert len(body["feature"]["scenarios"][0]["steps"]) == 3


async def test_get_file_not_found(async_client):
    resp = await async_client.get("/api/v1/features/file/nonexistent.feature")
    assert resp.status_code == 404


async def test_create_folder(async_client):
    resp = await async_client.post(
        "/api/v1/features/folders",
        json={"path": "new-folder"},
    )
    assert resp.status_code == 201

    tree_resp = await async_client.get("/api/v1/features/tree")
    names = [e["name"] for e in tree_resp.json()]
    assert "new-folder" in names


async def test_create_file(async_client):
    resp = await async_client.post(
        "/api/v1/features/files",
        json={
            "path": "created.feature",
            "feature": {
                "name": "Created Feature",
                "scenarios": [
                    {
                        "name": "A scenario",
                        "steps": [{"keyword": "Given", "text": "something"}],
                    }
                ],
            },
        },
    )
    assert resp.status_code == 201

    file_resp = await async_client.get("/api/v1/features/file/created.feature")
    assert file_resp.status_code == 200
    assert file_resp.json()["feature"]["name"] == "Created Feature"


async def test_update_file(async_client):
    resp = await async_client.put(
        "/api/v1/features/file/sample.feature",
        json={
            "name": "Updated Feature",
            "scenarios": [
                {
                    "name": "Updated scenario",
                    "steps": [{"keyword": "Then", "text": "updated"}],
                }
            ],
        },
    )
    assert resp.status_code == 200

    file_resp = await async_client.get("/api/v1/features/file/sample.feature")
    assert file_resp.json()["feature"]["name"] == "Updated Feature"


async def test_rename_file(async_client):
    resp = await async_client.patch(
        "/api/v1/features/sample.feature/rename",
        json={"new_name": "renamed.feature"},
    )
    assert resp.status_code == 200

    tree_resp = await async_client.get("/api/v1/features/tree")
    names = [e["name"] for e in tree_resp.json()]
    assert "sample.feature" not in names
    assert "renamed.feature" in names


async def test_delete_file(async_client):
    resp = await async_client.delete("/api/v1/features/sample.feature")
    assert resp.status_code == 200

    tree_resp = await async_client.get("/api/v1/features/tree")
    names = [e["name"] for e in tree_resp.json()]
    assert "sample.feature" not in names


async def test_sync(async_client):
    resp = await async_client.post("/api/v1/features/sync")
    assert resp.status_code == 200

    tree_resp = await async_client.get("/api/v1/features/tree")
    assert tree_resp.status_code == 200


async def test_path_traversal_returns_400(async_client):
    resp = await async_client.get("/api/v1/features/file/folder/..%2F..%2Fetc%2Fpasswd")
    assert resp.status_code == 400
