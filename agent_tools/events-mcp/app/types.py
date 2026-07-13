from typing import Optional
from pydantic import BaseModel


class Event(BaseModel):
    """Mirrors lib/models/events.ts on the website."""

    id: str
    name: str
    year: int
    theme: str
    tagline: str
    description: str
    date: str  # free-text date range, e.g. "OCT 24-26, 2025" — not a real Date field
    location: str
    participantsLabel: str
    highlights: list[str] = []
    isActive: bool = True
    competitions: list[str] = []  # competition ids
    createdAt: Optional[str] = None

    @classmethod
    def from_api(cls, data: dict) -> "Event":
        data = dict(data)
        if "_id" in data and "id" not in data:
            data["id"] = data.pop("_id")
        # competitions[] on the API may come back as populated objects
        # instead of bare ids depending on the route; normalize to ids only
        # here since full competition detail belongs to get_competition.
        comps = data.get("competitions", [])
        data["competitions"] = [
            c["_id"] if isinstance(c, dict) and "_id" in c else c for c in comps
        ]
        return cls(**data)


class EventSummary(BaseModel):
    """Trimmed shape for list views — drops the long-form description."""

    id: str
    name: str
    year: int
    tagline: str
    date: str
    location: str
    participantsLabel: str
    isActive: bool
    competitionCount: int


def to_event_summary(e: Event) -> EventSummary:
    return EventSummary(
        id=e.id,
        name=e.name,
        year=e.year,
        tagline=e.tagline,
        date=e.date,
        location=e.location,
        participantsLabel=e.participantsLabel,
        isActive=e.isActive,
        competitionCount=len(e.competitions),
    )


class Competition(BaseModel):
    """Mirrors lib/models/competition.ts on the website."""

    id: str
    eventId: str
    title: str
    type: str
    description: str
    minTeamSize: int
    maxTeamSize: int
    rules: list[str] = []
    registrationOpen: bool = False
    teams: list[str] = []  # team ids registered

    @classmethod
    def from_api(cls, data: dict) -> "Competition":
        data = dict(data)
        if "_id" in data and "id" not in data:
            data["id"] = data.pop("_id")
        teams = data.get("teams", [])
        data["teams"] = [t["_id"] if isinstance(t, dict) and "_id" in t else t for t in teams]
        event_id = data.get("eventId")
        if isinstance(event_id, dict) and "_id" in event_id:
            data["eventId"] = event_id["_id"]
        return cls(**data)


class CompetitionSummary(BaseModel):
    id: str
    eventId: str
    title: str
    type: str
    minTeamSize: int
    maxTeamSize: int
    registrationOpen: bool
    registeredTeamCount: int


def to_competition_summary(c: Competition) -> CompetitionSummary:
    return CompetitionSummary(
        id=c.id,
        eventId=c.eventId,
        title=c.title,
        type=c.type,
        minTeamSize=c.minTeamSize,
        maxTeamSize=c.maxTeamSize,
        registrationOpen=c.registrationOpen,
        registeredTeamCount=len(c.teams),
    )
