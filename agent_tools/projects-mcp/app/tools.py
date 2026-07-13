from typing import Optional
from .api_client import fetch_all_projects, fetch_project_by_id
from .types import Project, ProjectSummary, to_summary


def _matches_search(p: Project, query: str) -> bool:
    needle = query.lower()
    haystack = " ".join(
        [
            p.title,
            p.shortDescription,
            p.description,
            p.category,
            *p.techStack,
            *p.achievements,
        ]
    ).lower()
    return needle in haystack


async def list_projects(
    category: Optional[str] = None,
    tech: Optional[str] = None,
    featured_only: bool = False,
    include_unpublished: bool = False,
    search: Optional[str] = None,
    limit: int = 20,
) -> dict:
    """Core list/filter logic shared by list_projects and search_projects tools."""
    projects = await fetch_all_projects()

    if not include_unpublished:
        projects = [p for p in projects if p.published]
    if category:
        cat = category.lower()
        projects = [p for p in projects if p.category.lower() == cat]
    if tech:
        needle = tech.lower()
        projects = [p for p in projects if any(needle in t.lower() for t in p.techStack)]
    if featured_only:
        projects = [p for p in projects if p.featured]
    if search:
        projects = [p for p in projects if _matches_search(p, search)]

    limit = limit if limit and limit > 0 else 20
    limited = projects[:limit]

    return {"count": len(projects), "projects": [to_summary(p).model_dump() for p in limited]}


async def get_project(project_id: str) -> Optional[dict]:
    project = await fetch_project_by_id(project_id)
    return project.model_dump() if project else None


async def search_projects(query: str, limit: int = 10) -> dict:
    return await list_projects(search=query, limit=limit)


async def list_categories() -> list[str]:
    projects = [p for p in await fetch_all_projects() if p.published]
    return sorted({p.category for p in projects if p.category})


async def get_featured_projects(limit: int = 5) -> list[dict]:
    result = await list_projects(featured_only=True, limit=limit)
    return result["projects"]
