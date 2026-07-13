import httpx
from .config import settings
from .types import Event, Competition


class ApiError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status


# GET-only, same as projects-mcp's api_client.py — no write method exists
# anywhere in this file.


async def _get(path: str) -> dict | list:
    url = f"{settings.robo_api_base_url}{path}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(url)
    if res.status_code == 404:
        raise ApiError(404, f"GET {path} -> 404")
    if res.is_error:
        raise ApiError(res.status_code, f"GET {path} failed ({res.status_code}): {res.text}")
    return res.json()


async def fetch_all_events() -> list[Event]:
    data = await _get("/api/events")
    items = data if isinstance(data, list) else data.get("events", [])
    return [Event.from_api(item) for item in items]


async def fetch_event_by_id(event_id: str) -> Event | None:
    try:
        data = await _get(f"/api/events/{event_id}")
    except ApiError as e:
        if e.status == 404:
            return None
        raise
    if isinstance(data, dict) and "event" in data:
        data = data["event"]
    return Event.from_api(data)


async def fetch_competitions_for_event(event_id: str) -> list[Competition]:
    """The website's GET /api/competitions requires ?eventId=... (see
    lib/models/competition.ts — there's no getAllCompetitions(), only
    getCompetitionsByEvent(eventId)). There is no "list every competition
    across every event" endpoint on the backend, so this client only
    exposes the per-event fetch; aggregating across all events (if ever
    needed) happens in tools.py by calling this once per event."""
    data = await _get(f"/api/competitions?eventId={event_id}")
    items = data if isinstance(data, list) else data.get("competitions", [])
    return [Competition.from_api(item) for item in items]


async def fetch_competition_by_id(competition_id: str) -> Competition | None:
    try:
        data = await _get(f"/api/competitions/{competition_id}")
    except ApiError as e:
        if e.status == 404:
            return None
        raise
    if isinstance(data, dict) and "competition" in data:
        data = data["competition"]
    return Competition.from_api(data)