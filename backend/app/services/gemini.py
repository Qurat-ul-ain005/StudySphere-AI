import os
from dotenv import load_dotenv
from google import genai

# Load environment variables
load_dotenv()

# Gemini API Key
api_key = os.getenv("GEMINI_API_KEY")

# Create Gemini Client
client = genai.Client(api_key=api_key)


# ==========================================
# AI SUMMARY
# ==========================================

def summarize_text(text):

    prompt = f"""
You are an AI study assistant.

Summarize the following study material in simple and easy language.

Instructions:

- Keep the summary between 150-250 words.
- Use bullet points where appropriate.
- Highlight important concepts.
- Make it easy for students preparing for exams.

Study Material:

{text}
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
    )

    return response.text


# ==========================================
# AI TUTOR
# ==========================================

def answer_question(notes, question):

    prompt = f"""
You are StudySphere AI Tutor.

A student has uploaded study notes.

Use the uploaded notes as your PRIMARY source.

If the notes do not fully explain the topic,
you may use your own knowledge to provide
a better explanation.

Your answer MUST follow this format:

From Your Notes

Explain what the uploaded notes say.

Easy Explanation

Explain in simple words.

Real-Life Example

Give one practical example.

Key Points

• Point 1
• Point 2
• Point 3

Exam Tip

Give one short exam tip.

Uploaded Notes:

{notes}

Student Question:

{question}
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
    )

    return response.text


# ==========================================
# AI QUIZ GENERATOR
# ==========================================

def generate_quiz(text):

    prompt = f"""
You are an AI teacher.

Read the study material below and generate exactly 10
multiple-choice questions.

Rules:

1. Generate exactly 10 questions.
2. Every question must have 4 options.
3. Label the options A, B, C and D.
4. Clearly mention the correct answer for every question.
5. Only use information from the uploaded study material.
6. Do not invent information.
7. Make questions suitable for university students.
8. Make the questions clear and different from each other.

Use this exact format:

QUESTION 1:
Question text

A) Option A
B) Option B
C) Option C
D) Option D

CORRECT ANSWER: A

QUESTION 2:
Question text

A) Option A
B) Option B
C) Option C
D) Option D

CORRECT ANSWER: C

Continue this format until exactly 10 questions are generated.

Study Material:

{text}
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
    )

    return response.text


# ==========================================
# AI FLASHCARDS
# ==========================================

def generate_flashcards(text):

    prompt = f"""
You are an AI study assistant.

Read the study material below and create exactly 10 flashcards.

Rules:

1. Create exactly 10 flashcards.
2. Each flashcard must contain one Question and one Answer.
3. Keep answers short and easy to remember.
4. Only use information from the uploaded notes.
5. Do not invent information.
6. Make them useful for university exam revision.

IMPORTANT:
Separate every flashcard clearly.

Use EXACTLY this format:

FLASHCARD 1

Question: What is HTML?

Answer: HTML is used to create the structure of web pages.

FLASHCARD 2

Question: What is CSS?

Answer: CSS is used to style web pages.

FLASHCARD 3

Question: What is JavaScript?

Answer: JavaScript adds interactivity to web pages.

Continue until FLASHCARD 10.

Study Material:

{text}
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
    )

    return response.text


# ==========================================
# AI STUDY PLANNER
# ==========================================

def generate_study_plan(
    subject,
    exam_date,
    hours_per_day,
    document_text,
    available_days
):

    prompt = f"""
You are StudySphere AI Study Planner.

Your job is to create a personalized study plan
based primarily on the student's uploaded study material.

Student Information:

Subject: {subject}

Exam Date: {exam_date}

Study Hours Per Day: {hours_per_day}
Available Study Days: {available_days}

Uploaded Study Material:

{document_text}

IMPORTANT INSTRUCTIONS:

1. Analyze the uploaded study material carefully.
2. Identify the main topics and subtopics from the material.
3. Create the study plan using the topics found in the uploaded material.
4. Do NOT create a generic study plan based only on the subject name.
5. Divide the actual topics from the document across EXACTLY {available_days} study days.
6. Generate exactly {available_days} study days.
7. Do NOT create additional study days beyond the available study days.
8. The exam date itself is NOT a study day.
9. The final study day must be the day immediately before the exam.
10. Prioritize important concepts and difficult topics.
11. Include revision sessions before the exam.
12. Include quiz/practice sessions.
13. Use the available study hours realistically.
14. Make the schedule easy for a student to follow.
15. Do not include topics that are completely unrelated to the uploaded material.
16. If the uploaded material does not contain enough information,
    clearly state that and create the best possible plan from the available material.

OUTPUT FORMAT:

# Personalized Study Plan

## Study Overview
- Subject
- Exam Date
- Study Hours Per Day
- Available Study Days
- Main Topics Found in the Material

## Daily Schedule

For each available study day include:

### Day X — [Date]
- Topics to study
- Key concepts
- Study activities
- Revision/practice
- Recommended time allocation

Do not create any study day after the final day before the exam.

## Exam Day

### Exam — [Exam Date]
- Brief final preparation advice

## Final Revision

Include a final revision strategy before the exam.

Generate the complete personalized study plan.
"""

    response = client.models.generate_content(
    model="gemini-3.6-flash",
    contents=prompt,
)

    return response.text
# ==========================================
# AI EXPLANATION
# ==========================================

def explain_topic(text, topic):

    prompt = f"""
You are StudySphere AI Explanation Agent.

A student has uploaded study material and wants
a difficult topic explained in simple language.

Your job is to explain the requested topic clearly
using the uploaded study material as your PRIMARY source.

Topic to Explain:

{topic}

Study Material:

{text}

Instructions:

1. Explain the topic in simple and easy language.
2. Use the uploaded study material as the main source.
3. Do not invent information that is not supported by the material.
4. Break difficult concepts into smaller parts.
5. Give a simple example if the study material supports one.
6. Highlight important points.
7. Make the explanation suitable for a university student.
8. End with a short "Exam Tip".

Use this format:

TOPIC:
[Topic name]

SIMPLE EXPLANATION:
[Easy explanation]

IMPORTANT POINTS:
• Point 1
• Point 2
• Point 3

EXAMPLE:
[Simple example]

EXAM TIP:
[Short exam tip]
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
    )

    return response.text