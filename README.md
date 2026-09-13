\# StudySphere AI – Multi-Agent Learning Assistant



> \*\*One Platform. Multiple AI Learning Assistants.\*\*



StudySphere AI is a full-stack AI-powered web application designed to help students study from their own learning materials through multiple specialized AI learning assistants.



Instead of switching between different tools for summarization, question answering, quizzes, flashcards, study planning, and learning analytics, StudySphere AI combines these capabilities into one platform.



\---



\## Project Overview



StudySphere AI allows students to upload study materials and use AI-powered learning assistants to understand, revise, and organize their studies.



The system supports:



\- AI-powered document summarization

\- Interactive AI Tutor

\- Concept Explanation Agent

\- AI-generated quizzes

\- AI-generated flashcards

\- Personalized AI Study Planner

\- OCR-based image study-material processing

\- Learning progress tracking

\- Quiz history and performance analysis

\- Personalized study recommendations

\- Machine-learning-based quiz difficulty prediction



\---



\## Key Features



\### 1. Multi-Format Study Material Processing



StudySphere AI processes multiple types of educational materials:



\- PDF

\- DOCX

\- PPTX

\- JPG

\- JPEG

\- PNG

\- Scanned/image-based documents



Text is extracted from documents and images so that it can be used by the AI learning assistants.



\### 2. AI Summary Agent



Generates concise summaries from uploaded study materials to help students review large amounts of content quickly.



\### 3. AI Tutor



Students can ask questions about their uploaded study material and receive AI-generated explanations and answers.



\### 4. Explanation Agent



Provides concept-focused explanations designed to make difficult academic topics easier to understand.



\### 5. AI Quiz Generator



Generates interactive multiple-choice quizzes from uploaded study material.



The quiz system includes:



\- 10 MCQs

\- Answer validation

\- Correct/incorrect feedback

\- Score calculation

\- Persistent quiz-result storage



\### 6. AI Flashcard Generator



Automatically creates revision flashcards from study material.



Students can:



\- Reveal answers

\- Move to the previous card

\- Move to the next card



\### 7. AI Study Planner



Generates personalized study schedules using:



\- Subject

\- Exam date

\- Daily study hours

\- Selected uploaded study materials



\### 8. OCR Processing



Image-based study material can be processed using OCR so that text inside images can also be used by the AI learning assistants.



\### 9. Learning Dashboard



The dashboard provides an overview of the student's learning activity, including:



\- Uploaded documents

\- Recent study materials

\- AI activity

\- Quiz history

\- Learning progress

\- Study plans

\- Personalized recommendations

\- Quiz difficulty prediction



\### 10. Personalized Recommendations



The system analyzes previous quiz performance and provides study recommendations based on the student's results and weaker areas.



\### 11. Machine Learning Quiz Difficulty Prediction



A Random Forest classification model is integrated into the system to classify quiz difficulty based on quiz-performance features.



Difficulty categories include:



\- Easy

\- Medium

\- Hard



The system also provides a prediction confidence value.



\---



\## System Architecture



```text

&#x20;               ┌─────────────────────────┐

&#x20;               │        React.js         │

&#x20;               │     Frontend / UI       │

&#x20;               └────────────┬────────────┘

&#x20;                            │

&#x20;                            │ REST API

&#x20;                            ▼

&#x20;               ┌─────────────────────────┐

&#x20;               │        FastAPI          │

&#x20;               │        Backend          │

&#x20;               └────────────┬────────────┘

&#x20;                            │

&#x20;             ┌──────────────┼──────────────┐

&#x20;             │              │              │

&#x20;             ▼              ▼              ▼

&#x20;       ┌──────────┐   ┌───────────┐  ┌─────────────┐

&#x20;       │ Gemini AI│   │  SQLite   │  │ ML Service  │

&#x20;       │   API    │   │ Database  │  │ RandomForest│

&#x20;       └──────────┘   └───────────┘  └─────────────┘

&#x20;             │

&#x20;             ▼

&#x20;       ┌──────────────────────────────┐

&#x20;       │      AI Learning Agents      │

&#x20;       ├──────────────────────────────┤

&#x20;       │ Summary Agent                │

&#x20;       │ Tutor Agent                  │

&#x20;       │ Explanation Agent            │

&#x20;       │ Quiz Agent                   │

&#x20;       │ Flashcard Agent              │

&#x20;       │ Planner Agent                │

&#x20;       └──────────────────────────────┘

