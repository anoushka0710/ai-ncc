from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
import models
from auth.router import router as auth_router
from ncc.router import router as ncc_router
from filters.router import router as filters_router
from ai.router import router as ai_router
app = FastAPI(title="NCC CAMS API", version="1.0.0")

# Allow requests from the Next.js frontend (port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


# ── Routers ───────────────────────────────────────────
app.include_router(auth_router)
app.include_router(ncc_router)  # Include the NCC records router
app.include_router(filters_router)
app.include_router(ai_router)

@app.get("/")
def read_root():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)