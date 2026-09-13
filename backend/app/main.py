from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.upload import router as upload_router
from app.routes.ask import router as ask_router
from app.routes.auth import router as auth_router
from app.routes.dashboard import router as dashboard_router

from app.database.database import engine, Base
from app.models.user import User
from app.models.document import Document
from app.models.quiz import Quiz
from app.models.flashcard import Flashcard
from app.models.study_plan import StudyPlan
from app.models.quiz_result import QuizResult



# ==========================================
# Create FastAPI Application
# ==========================================

app = FastAPI(title="StudySphere AI")


# ==========================================
# Create Database Tables
# ==========================================

Base.metadata.create_all(bind=engine)


# ==========================================
# CORS Configuration
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# Include Routes
# ==========================================

app.include_router(upload_router)
app.include_router(ask_router)
app.include_router(auth_router)
app.include_router(dashboard_router)

# ==========================================
# Root Endpoint
# ==========================================

@app.get("/")
def home():
    return {
        "message": "StudySphere AI Backend is Running!"
    }