from app.services.gemini import summarize_text


def summary_agent(text):
    """
    Summary Agent

    Takes study material and generates
    an AI-powered summary.
    """

    if not text or not text.strip():
        return "No study material was provided."

    return summarize_text(text)