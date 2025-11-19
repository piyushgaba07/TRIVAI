from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.database import engine, Base
from app import models  
from app.api.v1.endpoints import auth, jeopardy, feud, connections

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("uvicorn")

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TrivAI API",
    description="Backend API for TrivAI game platform",
    version="0.1.0",
)

# CORS middleware configuration
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "https://trivai.in",
    "https://www.trivai.in"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(jeopardy.router, prefix="/api/v1/jeopardy", tags=["jeopardy"])
app.include_router(feud.router, prefix="/api/v1/feud", tags=["feud"])
app.include_router(connections.router, prefix="/api/v1/connections", tags=["connections"])

@app.get("/")
async def root():
    return {"message": "Welcome to TrivAI API!"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}