from typing import Optional
from fastmcp import FastMCP
from pydantic import Field
from . import tools as t

# ---------------------------------------------------------------------------
# events-mcp (Python / FastMCP)
#
# Read-only MCP server over the club's "events" and "competitions"
# collections (ROBOMANIA, BoTRUSH, and the individual competitions within
# them — rules, team size limits, registration status). Backed entirely by
# GET calls to the website's existing /api/events and /api/competitions
# routes (see api_client.py) — no write tool exists here.
#
# Note: "upcoming schedule" questions (dates/times to put on a calendar)
# are handled by calendar-mcp instead, since this server's `date` field on
# Event is free text (e.g. "OCT 24-26, 2025"), not a machine-readable
# timestamp — it's good for display, not for scheduling logic.
# ---------------------------------------------------------------------------

mcp = FastMCP("events-mcp")

READ_ONLY_ANNOTATIONS = {
    "readOnlyHint": True,
    "destructiveHint": False,
    "idempotentHint": True,
    "openWorldHint": True,
}


@mcp.tool(annotations=READ_ONLY_ANNOTATIONS)
async def list_events(
    active_only: bool = Field(default=True, description="If true, only return currently active events"),
    search: Optional[str] = Field(default=None, description="Free-text search across name, tagline, theme, description"),
) -> dict:
    """List the club's flagship events (e.g. ROBOMANIA, BoTRUSH). Returns
    active events only unless active_only is set to false."""
    return await t.list_events(active_only=active_only, search=search)


@mcp.tool(annotations=READ_ONLY_ANNOTATIONS)
async def get_event(
    event_id: str = Field(description="The event's MongoDB _id"),
) -> dict:
    """Get full details for a single event by its id, including
    description, highlights, location, date range, and its competition ids."""
    event = await t.get_event(event_id)
    if event is None:
        return {"error": f'No event found with id "{event_id}".'}
    return event


@mcp.tool(annotations=READ_ONLY_ANNOTATIONS)
async def list_competitions(
    event_id: Optional[str] = Field(default=None, description="Filter to competitions belonging to this event id"),
    registration_open_only: bool = Field(default=False, description="If true, only return competitions with open registration"),
) -> dict:
    """List competitions (e.g. 'Autonomous', 'Combat') within the club's
    events, optionally filtered by event or open-registration status. If
    event_id is omitted, this checks every event's competitions and merges
    them (the website has no single "list all competitions" endpoint)."""
    return await t.list_competitions(event_id=event_id, registration_open_only=registration_open_only)


@mcp.tool(annotations=READ_ONLY_ANNOTATIONS)
async def get_competition(
    competition_id: str = Field(description="The competition's MongoDB _id"),
) -> dict:
    """Get full details for a single competition, including rules, team
    size limits, and registration status."""
    comp = await t.get_competition(competition_id)
    if comp is None:
        return {"error": f'No competition found with id "{competition_id}".'}
    return comp