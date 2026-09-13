from app.services.gemini import generate_study_plan


def planner_agent(
    subject,
    exam_date,
    hours_per_day,
    document_text,
    available_days
):
    """
    Study Planner Agent

    Creates a personalized study plan based on:
    - Subject
    - Exam date
    - Available study hours
    - Number of available study days
    - Uploaded study material
    """

    if not subject or not subject.strip():
        return "Please enter a subject."

    if not exam_date or not exam_date.strip():
        return "Please enter an exam date."

    if hours_per_day <= 0:
        return "Study hours per day must be greater than 0."

    if available_days <= 0:
        return "The exam date must be after today."

    if not document_text or not document_text.strip():
        return "No study material was provided."

    return generate_study_plan(
        subject,
        exam_date,
        hours_per_day,
        document_text,
        available_days
    )