from app.services.gemini import generate_quiz


def quiz_agent(text):
    """
    Quiz Agent

    Takes study material and generates
    an AI-powered quiz.
    """

    if not text or not text.strip():
        return "No study material was provided."

    return generate_quiz(text)