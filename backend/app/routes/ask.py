from fastapi import APIRouter
from pydantic import BaseModel

from app.agents.tutor_agent import tutor_agent

router = APIRouter()


class QuestionRequest(BaseModel):
    notes: str
    question: str


@router.post("/ask")
def ask_ai(request: QuestionRequest):

    answer = tutor_agent(
        request.notes,
        request.question
    )

    return {
        "answer": answer
    }