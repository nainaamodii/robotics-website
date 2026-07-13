import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from .config import settings
from .server import mcp

# ---------------------------------------------------------------------------
# HTTP entrypoint for projects-mcp.
#
# FastMCP's app is mounted inside a normal FastAPI app, so we get a plain
# GET /health route (for uptime checks / PaaS health probes) alongside the
# MCP endpoint itself, without needing a second process.
#
# stateless_http=True: every request is handled independently, no session
# state kept between calls. Simplest correct choice for a small deployment
# — no shared state to manage, plays nicely with PaaS instances that can
# restart/scale at any time.
# ---------------------------------------------------------------------------

mcp_app = mcp.http_app(path="/mcp", stateless_http=True)

app = FastAPI(title="projects-mcp", lifespan=mcp_app.lifespan)


class BearerAuthMiddleware(BaseHTTPMiddleware):
    """Optional shared-secret auth for the /mcp endpoint only. Set
    MCP_AUTH_TOKEN in production so this isn't wide open on the public
    internet — the orchestrator sends it as `Authorization: Bearer <token>`.
    Left inactive (no-op) when MCP_AUTH_TOKEN is unset, for local dev."""

    async def dispatch(self, request: Request, call_next):
        if settings.mcp_auth_token and request.url.path.startswith("/mcp"):
            header = request.headers.get("authorization")
            if header != f"Bearer {settings.mcp_auth_token}":
                return JSONResponse({"error": "Unauthorized"}, status_code=401)
        return await call_next(request)


app.add_middleware(BearerAuthMiddleware)


@app.get("/health")
async def health():
    return {"status": "ok", "server": "projects-mcp"}


app.mount("/", mcp_app)


def main():
    uvicorn.run(app, host="0.0.0.0", port=settings.port)


if __name__ == "__main__":
    main()
