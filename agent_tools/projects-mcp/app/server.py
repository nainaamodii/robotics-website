from typing import Optional
from fastmcp import FastMCP
from pydantic import Field
from . import tools as t

# ---------------------------------------------------------------------------
# projects-mcp (Python / FastMCP)
#
# Read-only MCP server over the MNNIT Robotics Club "projects" collection.
# Every tool below is backed by a GET-only client (see api_client.py) — no
# create/update/delete/publish tool exists in this server by design. Write
# tools, if ever needed, belong in a clearly separate, explicitly-gated
# server so a public-facing chatbot can never reach a mutating tool.
# ---------------------------------------------------------------------------

mcp = FastMCP("projects-mcp")


@mcp.tool()
async def list_projects(
    category: Optional[str] = Field(default=None, description="Exact category name to filter by, e.g. 'Autonomous Robotics'"),
    tech: Optional[str] = Field(default=None, description="Substring match against techStack entries, e.g. 'ROS' or 'ESP32'"),
    featured_only: bool = Field(default=False, description="If true, only return featured projects"),
    include_unpublished: bool = Field(default=False, description="If true, include draft/unpublished projects. Only use for admin-facing requests."),
    search: Optional[str] = Field(default=None, description="Free-text search across title, descriptions, category, tech stack, achievements"),
    limit: int = Field(default=20, ge=1, le=100, description="Max results to return"),
) -> dict:
    """List/browse robotics club projects with optional filters. Returns
    published projects only unless include_unpublished is explicitly set.
    Use this for browsing/filtering; use search_projects for a plain-text
    query instead."""
    return await t.list_projects(
        category=category,
        tech=tech,
        featured_only=featured_only,
        include_unpublished=include_unpublished,
        search=search,
        limit=limit,
    )


@mcp.tool()
async def get_project(
    project_id: str = Field(description="The project's MongoDB _id"),
) -> dict:
    """Get full details for a single project by its id, including full
    description, markdown content, contributors, mentors, tech stack,
    hardware/software used, achievements, and links."""
    project = await t.get_project(project_id)
    if project is None:
        return {"error": f'No project found with id "{project_id}".'}
    return project


@mcp.tool()
async def search_projects(
    query: str = Field(description="Search text"),
    limit: int = Field(default=10, ge=1, le=50, description="Max results to return"),
) -> dict:
    """Free-text search over published projects (title, descriptions,
    category, tech stack, achievements). Use for natural-language queries
    like 'projects using ROS' or 'combat robot projects'."""
    return await t.search_projects(query, limit)


@mcp.tool()
async def list_categories() -> list[str]:
    """List the distinct project categories currently in use across
    published projects."""
    return await t.list_categories()


@mcp.tool()
async def get_featured_projects(
    limit: int = Field(default=5, ge=1, le=20, description="Max results to return"),
) -> list[dict]:
    """Get the club's featured/highlighted projects — useful for 'what's
    your best work' or landing-page style questions."""
    return await t.get_featured_projects(limit)
