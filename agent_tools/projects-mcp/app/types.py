from typing import Optional
from pydantic import BaseModel


class Contributor(BaseModel):
    name: str
    role: str
    github: Optional[str] = None


class ProjectLinks(BaseModel):
    github: Optional[str] = None
    documentation: Optional[str] = None
    demo: Optional[str] = None


class Project(BaseModel):
    """Mirrors lib/models/project.ts in the main robo-website repo."""

    id: str
    title: str
    description: str
    shortDescription: str
    category: str
    image: str
    featured: bool = False
    published: bool = False
    hardwareUsed: list[str] = []
    softwareUsed: list[str] = []
    techStack: list[str] = []
    contributors: list[Contributor] = []
    mentors: list[Contributor] = []
    content: str = ""
    achievements: list[str] = []
    links: ProjectLinks = ProjectLinks()
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    class Config:
        # The website's API returns Mongo's `_id`; accept it as an alias
        # for `id` so we don't force the upstream API to change shape.
        populate_by_name = True

    @classmethod
    def from_api(cls, data: dict) -> "Project":
        data = dict(data)
        if "_id" in data and "id" not in data:
            data["id"] = data.pop("_id")
        return cls(**data)


class ProjectSummary(BaseModel):
    """Trimmed shape for list views — no full `content`/`description`,
    so a list_projects call doesn't dump every project's full markdown
    into the LLM's context."""

    id: str
    title: str
    shortDescription: str
    descriptionPreview: str
    category: str
    image: str
    featured: bool
    published: bool
    hardwareUsed: list[str]
    softwareUsed: list[str]
    techStack: list[str]
    contributors: list[Contributor]
    mentors: list[Contributor]
    achievements: list[str]
    links: ProjectLinks


def to_summary(p: Project) -> ProjectSummary:
    preview = p.description[:217] + "..." if len(p.description) > 220 else p.description
    return ProjectSummary(
        id=p.id,
        title=p.title,
        shortDescription=p.shortDescription,
        descriptionPreview=preview,
        category=p.category,
        image=p.image,
        featured=p.featured,
        published=p.published,
        hardwareUsed=p.hardwareUsed,
        softwareUsed=p.softwareUsed,
        techStack=p.techStack,
        contributors=p.contributors,
        mentors=p.mentors,
        achievements=p.achievements,
        links=p.links,
    )
