from app.services.gemini import explain_topic


def explanation_agent(text, topic):
    """
    Explanation Agent

    Explains a difficult topic from the uploaded
    study material in simple language.
    """

    if not text or not text.strip():
        return "No study material was provided."

    if not topic or not topic.strip():
        return "Please provide a topic to explain."

    return explain_topic(text, topic)