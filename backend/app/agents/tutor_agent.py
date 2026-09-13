from app.services.gemini import answer_question


def tutor_agent(notes, question):
    """
    Tutor Agent

    Uses the student's uploaded notes to answer
    questions and provide easy explanations.
    """

    if not notes or not notes.strip():
        return "No study material was provided."

    if not question or not question.strip():
        return "Please enter a question."

    return answer_question(notes, question)