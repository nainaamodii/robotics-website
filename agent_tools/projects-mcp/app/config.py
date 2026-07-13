from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Base URL of the Next.js website — this server only ever calls its
    # existing GET /api/projects and /api/projects/{id} routes.
    robo_api_base_url: str = "http://localhost:3000"

    # Optional shared-secret auth for this server's own /mcp endpoint.
    # If unset, the endpoint is open (fine for local dev only).
    mcp_auth_token: str | None = None

    # Port this service listens on.
    port: int = 4001

    class Config:
        env_prefix = ""


settings = Settings()
