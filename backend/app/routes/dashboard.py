from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.quiz import Quiz
from app.models.quiz_result import QuizResult
from app.models.flashcard import Flashcard
from app.models.study_plan import StudyPlan
from app.services.ml_difficulty import predict_difficulty


router = APIRouter()


# =========================================================
# DASHBOARD STATS
# =========================================================

@router.get("/dashboard/stats")
def get_dashboard_stats(
    user_id: int = Header(..., alias="user-id"),
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    documents_count = db.query(Document).filter(
        Document.user_id == user_id
    ).count()

    quizzes_count = db.query(QuizResult).filter(
        QuizResult.user_id == user_id
    ).count()

    flashcards_count = db.query(Flashcard).filter(
        Flashcard.user_id == user_id
    ).count()

    study_plans_count = db.query(StudyPlan).filter(
        StudyPlan.user_id == user_id
    ).count()

    return {
        "documents": documents_count,
        "quizzes": quizzes_count,
        "flashcards": flashcards_count,
        "studyPlans": study_plans_count
    }


# =========================================================
# STUDY PLANNER DOCUMENTS
# =========================================================

@router.get("/dashboard/documents")
def get_dashboard_documents(
    user_id: int = Header(..., alias="user-id"),
    db: Session = Depends(get_db)
):

    print("========================================")
    print("STUDY PLANNER DOCUMENT REQUEST")
    print("User ID:", user_id)
    print("========================================")

    # Check user
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        print("ERROR: User not found")
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    print("User found:", user.id)

    # Get ALL documents belonging to this user
    documents = (
        db.query(Document)
        .filter(Document.user_id == user_id)
        .order_by(Document.id.desc())
        .all()
    )

    print("Documents found:", len(documents))

    result = [
        {
            "id": document.id,
            "filename": document.filename,
            "uploaded_at": document.uploaded_at
        }
        for document in documents
    ]

    print("Returning documents:", result)

    return {
        "documents": result
    }

    # =========================================================
# PERSONALIZED STUDY RECOMMENDATIONS
# =========================================================

@router.get("/dashboard/recommendations")
def get_study_recommendations(
    user_id: int = Header(..., alias="user-id"),
    db: Session = Depends(get_db)
):

    # Check user
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    # Get quiz results for this user
    results = (
        db.query(QuizResult)
        .filter(QuizResult.user_id == user_id)
        .order_by(QuizResult.id.desc())
        .all()
    )

    # No quiz history yet
    if not results:
        return {
            "average_percentage": 0,
            "weakest_material": None,
            "recommendation": (
                "Take your first quiz to receive "
                "a personalized study recommendation."
            )
        }

    # Calculate average performance
    average_percentage = sum(
        result.percentage for result in results
    ) / len(results)

    # Find weakest quiz result
    weakest_result = min(
        results,
        key=lambda result: result.percentage
    )

    # Find the quiz connected to the result
    weakest_quiz = None

    if weakest_result.quiz_id:
        weakest_quiz = (
            db.query(Quiz)
            .filter(Quiz.id == weakest_result.quiz_id)
            .first()
        )

    if weakest_quiz and weakest_quiz.filename:
        weakest_material = weakest_quiz.filename
    else:
        weakest_material = "your recent study material"

    # Create recommendation
    if average_percentage < 50:

        recommendation = (
            f"Your average quiz performance is "
            f"{average_percentage:.1f}%. "
            f"You need significant revision. "
            f"Review {weakest_material} and take another practice quiz."
        )

    elif average_percentage < 70:

        recommendation = (
            f"Your average quiz performance is "
            f"{average_percentage:.1f}%. "
            f"You need more practice. "
            f"Review {weakest_material} and generate another quiz."
        )

    elif average_percentage < 85:

        recommendation = (
            f"Your average quiz performance is "
            f"{average_percentage:.1f}%. "
            f"Your understanding is good, but more practice "
            f"can improve your performance. Review {weakest_material}."
        )

    else:

        recommendation = (
            f"Excellent! Your average quiz performance is "
            f"{average_percentage:.1f}%. "
            f"You have a strong understanding of the material. "
            f"Continue practicing and move toward advanced topics."
        )

    # ---------------------------------------------------------
    # Add ML difficulty insight from the latest quiz
    # ---------------------------------------------------------

    latest_result = results[0]

    ml_prediction = predict_difficulty(
        percentage=latest_result.percentage,
        total_questions=latest_result.total_questions
    )

    recommendation = (
        f"{recommendation} "
        f"Your latest quiz was classified as "
        f"{ml_prediction['difficulty']} difficulty by the ML model."
    )

    return {
        "average_percentage": round(
            average_percentage,
            1
        ),
        "weakest_material": weakest_material,
        "recommendation": recommendation,
        "ml_difficulty": ml_prediction["difficulty"],
        "ml_confidence": ml_prediction["confidence"]
    }
    # =========================================================
# AI / ML QUIZ DIFFICULTY PREDICTION
# =========================================================

@router.get("/dashboard/difficulty")
def get_quiz_difficulty(
    user_id: int = Header(..., alias="user-id"),
    db: Session = Depends(get_db)
):

    # Check user
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    # Get the user's most recent quiz result
    latest_result = (
        db.query(QuizResult)
        .filter(
            QuizResult.user_id == user_id
        )
        .order_by(
            QuizResult.id.desc()
        )
        .first()
    )

    # No quiz taken yet
    if not latest_result:
        return {
            "available": False,
            "message": "Take a quiz to receive an AI difficulty prediction."
        }

    # Run ML model
    prediction = predict_difficulty(
        percentage=latest_result.percentage,
        total_questions=latest_result.total_questions
    )

    return {
        "available": True,
        "difficulty": prediction["difficulty"],
        "confidence": prediction["confidence"],
        "percentage": latest_result.percentage,
        "score": latest_result.score,
        "total_questions": latest_result.total_questions
    }
    # =========================================================
# PREVIOUS QUIZ SESSIONS / HISTORY
# =========================================================

@router.get("/dashboard/quiz-history")
def get_quiz_history(
    user_id: int = Header(..., alias="user-id"),
    db: Session = Depends(get_db)
):

    # Check user
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    # Get quiz results for this user
    results = (
        db.query(QuizResult)
        .filter(QuizResult.user_id == user_id)
        .order_by(QuizResult.id.desc())
        .all()
    )

    history = []

    for result in results:

        quiz = None

        if result.quiz_id:
            quiz = (
                db.query(Quiz)
                .filter(Quiz.id == result.quiz_id)
                .first()
            )

        history.append({
            "id": result.id,
            "quiz_id": result.quiz_id,
            "filename": quiz.filename if quiz else "Quiz",
            "score": result.score,
            "total_questions": result.total_questions,
            "percentage": round(result.percentage, 1)
        })

    return {
        "history": history
    }