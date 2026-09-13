from app.services.gemini import generate_flashcards


def flashcard_agent(text):
    """
    Flashcard Agent

    Takes study material and generates
    AI-powered flashcards for revision.
    """

    if not text or not text.strip():
        return "No study material was provided."

    return generate_flashcards(text)