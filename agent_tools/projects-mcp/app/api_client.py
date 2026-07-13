import httpx
from .config import settings
from .types import Project


class ApiError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status


# This module ONLY issues GET requests. There is no post/put/delete
# function anywhere in this file — the MCP server built on top of it is
# read-only by construction, not just by convention.


async def fetch_all_projects() -> list[Project]:
    url = f"{settings.robo_api_base_url}/api/projects"
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(url)
    if res.is_error:
        raise ApiError(res.status_code, f"GET /api/projects failed ({res.status_code}): {res.text}")
    data = res.json()
    items = data if isinstance(data, list) else data.get("projects", [])
    return [Project.from_api(item) for item in items]


async def fetch_project_by_id(project_id: str) -> Project | None:
    url = f"{settings.robo_api_base_url}/api/projects/{project_id}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(url)
    if res.status_code == 404:
        return None
    if res.is_error:
        raise ApiError(res.status_code, f"GET /api/projects/{project_id} failed ({res.status_code}): {res.text}")
    data = res.json()
    if isinstance(data, dict) and "project" in data:
        data = data["project"]
    return Project.from_api(data)
