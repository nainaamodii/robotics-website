import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from .config import settings
from .server import mcp

mcp_app = mcp.http_app(path="/mcp", stateless_http=True)

app = FastAPI(title="events-mcp", lifespan=mcp_app.lifespan)


class BearerAuthMiddleware(BaseHTTPMiddleware):
    """Optional shared-secret auth for the /mcp endpoint only. See
    projects-mcp/app/main.py for the same pattern and rationale."""

    async def dispatch(self, request: Request, call_next):
        if settings.mcp_auth_token and request.url.path.startswith("/mcp"):
            header = request.headers.get("authorization")
            if header != f"Bearer {settings.mcp_auth_token}":
                return JSONResponse({"error": "Unauthorized"}, status_code=401)
        return await call_next(request)


app.add_middleware(BearerAuthMiddleware)


@app.get("/health")
async def health():
    return {"status": "ok", "server": "events-mcp"}


app.mount("/", mcp_app)


def main():
    uvicorn.run(app, host="0.0.0.0", port=settings.port)


if __name__ == "__main__":
    main()
