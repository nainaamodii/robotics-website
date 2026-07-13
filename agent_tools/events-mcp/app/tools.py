from typing import Optional
import asyncio
from .api_client import (
    fetch_all_events,
    fetch_event_by_id,
    fetch_competitions_for_event,
    fetch_competition_by_id,
)
from .types import to_event_summary, to_competition_summary


async def list_events(active_only: bool = True, search: Optional[str] = None) -> dict:
    events = await fetch_all_events()
    if active_only:
        events = [e for e in events if e.isActive]
    if search:
        needle = search.lower()
        events = [
            e
            for e in events
            if needle in e.name.lower()
            or needle in e.tagline.lower()
            or needle in e.theme.lower()
            or needle in e.description.lower()
        ]
    return {"count": len(events), "events": [to_event_summary(e).model_dump() for e in events]}


async def get_event(event_id: str) -> Optional[dict]:
    event = await fetch_event_by_id(event_id)
    return event.model_dump() if event else None


async def list_competitions(event_id: Optional[str] = None, registration_open_only: bool = False) -> dict:
    if event_id:
        comps = await fetch_competitions_for_event(event_id)
    else:
        # The website has no "list every competition" endpoint (see
        # api_client.py) — only per-event. So "list all" means: fetch
        # every event, then fetch that event's competitions, in parallel,
        # and merge. Fine at club scale (a handful of events); would need
        # a real backend endpoint if this list ever grew large.
        events = await fetch_all_events()
        results = await asyncio.gather(
            *(fetch_competitions_for_event(str(e.id)) for e in events)
        )
        comps = [c for group in results for c in group]

    if registration_open_only:
        comps = [c for c in comps if c.registrationOpen]

    return {
        "count": len(comps),
        "competitions": [to_competition_summary(c).model_dump() for c in comps],
    }


async def get_competition(competition_id: str) -> Optional[dict]:
    comp = await fetch_competition_by_id(competition_id)
    return comp.model_dump() if comp else None