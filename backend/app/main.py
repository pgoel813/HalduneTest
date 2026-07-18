from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import init_db
from app.routers import debriefs

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (models are imported via the routers).
    init_db()
    yield


app = FastAPI(title="Haldune Test API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


app.include_router(debriefs.router)
