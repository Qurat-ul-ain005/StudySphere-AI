from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi import Depends

import os
import shutil
import json
from datetime import date, datetime

from app.database.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.quiz import Quiz
from app.models.flashcard import Flashcard
from app.models.study_plan import StudyPlan

from app.services.pdf_reader import extract_text, extract_image_text

from app.agents.summary_agent import summary_agent
from app.agents.quiz_agent import quiz_agent
from app.agents.flashcard_agent import flashcard_agent
from app.agents.tutor_agent import tutor_agent
from app.agents.planner_agent import planner_agent


router = APIRouter()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# =========================================================
# UPLOAD DOCUMENT
# Supports PDF, DOCX, PPTX, PNG, JPG and JPEG
# =========================================================

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    user_id: int = Header(...),
    db: Session = Depends(get_db)
):

    # Allowed file types
    allowed_extensions = [
        ".pdf",
        ".docx",
        ".pptx",
        ".png",
        ".jpg",
        ".jpeg"
    ]

    file_extension = os.path.splitext(file.filename)[1].lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOCX, PPTX, PNG, JPG, and JPEG files are supported."
        )
        

    # Create file path
    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    # Save uploaded file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save the uploaded file: {str(e)}"
        )

    # Extract text from document
    try:

        if file_extension in [".png", ".jpg", ".jpeg"]:
            text = extract_image_text(file_path)

        else:
            text = extract_text(file_path)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not extract text from the uploaded file: {str(e)}"
        )

    # Check extracted text
    if not text or not text.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from the uploaded file."
        )

    # Send text to Summary Agent
    try:
        summary = summary_agent(text)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Summary generation failed: {str(e)}"
        )

    # Check that the user exists
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    # Check if this document already exists for this user
    document = db.query(Document).filter(
        Document.user_id == user_id,
        Document.filename == file.filename
    ).first()

    if document:
        # Update existing document instead of creating a duplicate
        document.extracted_text = text
        document.summary = summary
        document.uploaded_at = datetime.utcnow()

    else:
        # Create a new document record
        document = Document(
            user_id=user_id,
            filename=file.filename,
            extracted_text=text,
            summary=summary
        )

        db.add(document)

    db.commit()
    db.refresh(document)

    return {
    "filename": file.filename,
    "text": text,
    "summary": summary,
    "document_id": document.id
}


# =========================================================
# AI TUTOR
# =========================================================

class QuestionRequest(BaseModel):
    notes: str
    question: str


@router.post("/ask")
async def ask_ai(request: QuestionRequest):

    try:
        answer = tutor_agent(
            request.notes,
            request.question
        )

        return {
            "answer": answer
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI Tutor failed: {str(e)}"
        )


# =========================================================
# AI QUIZ GENERATOR
# =========================================================

@router.post("/quiz")
async def quiz(
    file: UploadFile = File(...),
    user_id: int = Header(..., alias="user-id"),
    db: Session = Depends(get_db)
):

    allowed_extensions = [
        ".pdf",
        ".docx",
        ".pptx",
        ".png",
        ".jpg",
        ".jpeg"
    ]

    file_extension = os.path.splitext(file.filename)[1].lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOCX, PPTX, PNG, JPG, and JPEG files are supported."
        )

    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    try:
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract text
        text = extract_text(file_path)

        if not text or not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the uploaded file."
            )

        # Generate quiz using AI
        quiz_result = quiz_agent(text)

        # ---------------------------------------------
        # Save generated quiz to database
        # ---------------------------------------------

        saved_quiz = Quiz(
            user_id=user_id,
            filename=file.filename,
            quiz_content=quiz_result
        )

        db.add(saved_quiz)
        db.commit()
        db.refresh(saved_quiz)

        # Return quiz and its database ID
        return {
            "quiz": quiz_result,
            "quiz_id": saved_quiz.id
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Quiz generation failed: {str(e)}"
        )

# =========================================================
# AI FLASHCARDS
# =========================================================

@router.post("/flashcards")
async def flashcards(
    file: UploadFile = File(...),
    user_id: int = Header(...),
    db: Session = Depends(get_db)
):

    allowed_extensions = [".pdf", ".docx", ".pptx", ".png", ".jpg", ".jpeg"]

    file_extension = os.path.splitext(file.filename)[1].lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOCX, PPTX, PNG, JPG, and JPEG files are supported."
        )

    # Check that the user exists
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    try:
        # Save uploaded file temporarily
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract text
        text = extract_text(file_path)

        if not text or not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the uploaded file."
            )

        # Generate flashcards using AI
        flashcards_result = flashcard_agent(text)

        # Save generated flashcard set to database
        flashcard_record = Flashcard(
            user_id=user_id,
            filename=file.filename,
            flashcards_content=flashcards_result
        )

        db.add(flashcard_record)
        db.commit()
        db.refresh(flashcard_record)

        # Return generated flashcards to frontend
        return {
            "flashcards": flashcards_result
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()


        raise HTTPException(
            status_code=500,
            detail=f"Flashcard generation failed: {str(e)}"
        )

# =========================================================
# STUDY PLANNER
# =========================================================

class StudyPlanRequest(BaseModel):
    subject: str
    exam_date: str
    hours_per_day: int
    document_ids: list[int]


@router.post("/study-plan")
async def study_plan(
    request: StudyPlanRequest,
    user_id: int = Header(...),
    db: Session = Depends(get_db)
):
    try:
        # -------------------------------------------------
        # Check that at least one document was selected
        # -------------------------------------------------
        if not request.document_ids:
            raise HTTPException(
                status_code=400,
                detail="Please select at least one study document."
            )

        # -------------------------------------------------
        # Get all selected documents belonging to the user
        # -------------------------------------------------
        documents = db.query(Document).filter(
            Document.id.in_(request.document_ids),
            Document.user_id == user_id
        ).all()

        # -------------------------------------------------
        # Make sure all selected documents were found
        # -------------------------------------------------
        if len(documents) != len(request.document_ids):
            raise HTTPException(
                status_code=404,
                detail="One or more selected study documents were not found."
            )

        # -------------------------------------------------
        # Combine extracted text from all documents
        # -------------------------------------------------
        document_parts = []

        for document in documents:

            if document.extracted_text and document.extracted_text.strip():

                document_parts.append(
                    f"""
=========================================================
STUDY MATERIAL: {document.filename}
=========================================================

{document.extracted_text}
"""
                )

        # -------------------------------------------------
        # Make sure there is readable material
        # -------------------------------------------------
        if not document_parts:
            raise HTTPException(
                status_code=400,
                detail="The selected documents do not contain readable text."
            )

        # -------------------------------------------------
        # Combine all selected document text
        # -------------------------------------------------
        document_text = "\n\n".join(document_parts)

        # -------------------------------------------------
        # Calculate available study days
        # -------------------------------------------------
        try:
            today = date.today()

            exam_date = datetime.strptime(
                request.exam_date,
                "%Y-%m-%d"
            ).date()

            available_days = (exam_date - today).days

        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Exam date must be in YYYY-MM-DD format."
            )

        # -------------------------------------------------
        # Make sure there is at least one study day
        # -------------------------------------------------
        if available_days <= 0:
            raise HTTPException(
                status_code=400,
                detail="Exam date must be after today."
            )

        # -------------------------------------------------
        # Generate study plan using all selected documents
        # -------------------------------------------------
        plan = planner_agent(
            request.subject,
            request.exam_date,
            request.hours_per_day,
            document_text,
            available_days
        )

        # -------------------------------------------------
        # Save generated study plan to database
        # -------------------------------------------------
        saved_plan = StudyPlan(
            user_id=user_id,
            subject=request.subject,
            exam_date=request.exam_date,
            hours_per_day=request.hours_per_day,
            document_ids=json.dumps(request.document_ids),
            study_plan=plan
        )

        db.add(saved_plan)
        db.commit()
        db.refresh(saved_plan)

        # -------------------------------------------------
        # Return generated study plan
        # -------------------------------------------------
        return {
            "study_plan": plan
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Study plan generation failed: {str(e)}"
        )


# =========================================================
# SAVE QUIZ RESULT
# =========================================================
# =========================================================
# SAVE QUIZ RESULT
# =========================================================

class QuizResultRequest(BaseModel):
    score: int
    total_questions: int
    quiz_id: int | None = None


@router.post("/quiz/result")
async def save_quiz_result(
    request: QuizResultRequest,
    user_id: int = Header(...),
    db: Session = Depends(get_db)
):
    try:
        # ---------------------------------------------
        # Validate quiz result
        # ---------------------------------------------

        if request.total_questions <= 0:
            raise HTTPException(
                status_code=400,
                detail="Total questions must be greater than 0."
            )

        if request.score < 0 or request.score > request.total_questions:
            raise HTTPException(
                status_code=400,
                detail="Invalid quiz score."
            )

        # ---------------------------------------------
        # Check user
        # ---------------------------------------------

        user = db.query(User).filter(
            User.id == user_id
        ).first()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found."
            )

        # ---------------------------------------------
        # Calculate percentage
        # ---------------------------------------------

        percentage = (
            request.score / request.total_questions
        ) * 100

        # ---------------------------------------------
        # Save result
        # ---------------------------------------------

        from app.models.quiz_result import QuizResult

        result = QuizResult(
    user_id=user_id,
    quiz_id=request.quiz_id,
    score=request.score,
    total_questions=request.total_questions,
    percentage=percentage
)

        db.add(result)
        db.commit()
        db.refresh(result)

        return {
            "message": "Quiz result saved successfully.",
            "score": result.score,
            "total_questions": result.total_questions,
            "percentage": result.percentage
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save quiz result: {str(e)}"
        )