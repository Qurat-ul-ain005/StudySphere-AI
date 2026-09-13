import { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./Upload.css";

function parseQuiz(quizText) {
    if (!quizText) return [];

    const questions = quizText.split(/QUESTION\s+\d+:/i).slice(1);

    return questions.map((block, index) => {

        const parts = block.split(/CORRECT ANSWER:/i);

        const questionPart = parts[0] || "";
        const correctAnswer = (parts[1] || "").trim().charAt(0).toUpperCase();

        const lines = questionPart
            .split("\n")
            .map(line => line.trim())
            .filter(line => line);

        const question = lines[0] || "";

        const options = lines
            .filter(line => /^[A-D]\)/i.test(line))
            .map(line => ({
                letter: line.charAt(0).toUpperCase(),
                text: line.substring(2).trim()
            }));

        return {
            id: index,
            question,
            options,
            correctAnswer
        };
    });
}
function Upload() {

    const [selectedFile, setSelectedFile] = useState(null);
    const [message, setMessage] = useState("");
    const [text, setText] = useState("");
    const [summary, setSummary] = useState("");
    const [documentId, setDocumentId] = useState(null);

    // ==========================
    // AI Tutor
    // ==========================

    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);

    // ==========================
    // AI Quiz
    // ==========================

    const [quiz, setQuiz] = useState("");
    const [quizId, setQuizId] = useState(null);
    const [quizLoading, setQuizLoading] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizScore, setQuizScore] = useState(0);

    // ==========================
    // AI Flashcards
    // ==========================

    const [flashcards, setFlashcards] = useState("");
    const [flashcardLoading, setFlashcardLoading] = useState(false);

    // ==========================
    // AI Study Planner
    // ==========================

    const [subject, setSubject] = useState("");
    const [examDate, setExamDate] = useState("");
    const [hoursPerDay, setHoursPerDay] = useState("");

    const [studyPlan, setStudyPlan] = useState("");
    const [plannerLoading, setPlannerLoading] = useState(false);

    // ==========================
    // File Selection
    // ==========================

    const handleFileChange = (event) => {

        setSelectedFile(event.target.files[0]);

        // Clear previous results when selecting a new file
        setMessage("");
        setText("");
        setSummary("");
        setQuestion("");
        setAnswer("");
        setQuiz("");
        setFlashcards("");
        setStudyPlan("");
    };

    // ==========================
    // Upload Document
    // ==========================

    const handleUpload = async () => {

        if (!selectedFile) {
            setMessage("Please select a PDF, Word, or PowerPoint file.");
            return;
        }

        // Get logged-in user
        let user = null;

        try {
            user = JSON.parse(localStorage.getItem("user"));
        } catch (error) {
            console.error("Could not read logged-in user:", error);
        }

        if (!user || !user.id) {
            setMessage("❌ Please login again.");
            return;
        }

        const formData = new FormData();

        formData.append("file", selectedFile);

        try {

            setMessage("Uploading and processing your document...");

            const response = await fetch(
                "http://127.0.0.1:8000/upload",
                {
                    method: "POST",

                    headers: {
                        "user-id": String(user.id),
                    },

                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {

                let errorMessage = "Upload failed.";

                if (Array.isArray(data.detail)) {
                    errorMessage = data.detail
                        .map(item => item.msg || JSON.stringify(item))
                        .join("; ");
                } else if (typeof data.detail === "string") {
                    errorMessage = data.detail;
                } else if (data.detail) {
                    errorMessage = JSON.stringify(data.detail);
                }

                throw new Error(errorMessage);
            }

            setMessage("✅ File uploaded successfully!");
            setText(data.text || "");
            setSummary(data.summary || "");
            setDocumentId(data.document_id);

            // Reset AI features
            setQuestion("");
            setAnswer("");
            setQuiz("");
            setFlashcards("");
            setStudyPlan("");

        } catch (error) {

            console.error("Upload error:", error);

            setMessage(
                `❌ ${error.message || "Upload failed."}`
            );
        }
    };
    // ==========================
    // AI Tutor
    // ==========================

    const handleAsk = async () => {

        if (!question.trim()) {

            alert("Please enter a question.");

            return;
        }

        setLoading(true);

        try {

            const response = await fetch(
                "http://127.0.0.1:8000/ask",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        notes: text,
                        question: question,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.detail || "AI Tutor request failed."
                );
            }

            setAnswer(data.answer);

        }

        catch (error) {

            console.error(error);

            setAnswer(
                `❌ ${error.message || "Failed to get AI answer."}`
            );
        }

        finally {

            setLoading(false);
        }
    };

    // ==========================
    // AI Quiz
    // ==========================

    const handleGenerateQuiz = async () => {

        if (!selectedFile) {

            alert("Please upload a document first.");

            return;
        }

        setQuizLoading(true);

        const formData = new FormData();

        formData.append("file", selectedFile);

        // Get logged-in user
        const user = JSON.parse(
            localStorage.getItem("user")
        );

        if (!user || !user.id) {
            setMessage("Please login again.");
            return;
        }

        try {

            const response = await fetch(
                "http://127.0.0.1:8000/quiz",
                {
                    method: "POST",
                    headers: {
                        "user-id": String(user.id),
                    },
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.detail || "Quiz generation failed."
                );
            }

            setQuiz(data.quiz);
            setQuizId(data.quiz_id);
            setSelectedAnswers({});
            setQuizSubmitted(false);
            setQuizScore(0);

        }

        catch (error) {

            console.error(error);

            setQuiz(
                `❌ ${error.message || "Quiz generation failed."}`
            );
        }

        finally {

            setQuizLoading(false);
        }
    };
    // ==========================
    // Submit Quiz
    // ==========================

    const handleSubmitQuiz = async () => {
        const questions = parseQuiz(quiz);

        let score = 0;

        questions.forEach((q, index) => {
            const userAnswer = selectedAnswers[index];
            const correctAnswer = q.correctAnswer;

            if (userAnswer === correctAnswer) {
                score++;
            }
        });

        const totalQuestions = questions.length;

        setQuizScore(score);
        setQuizSubmitted(true);

        // Save quiz result to backend
        try {
            const user = JSON.parse(localStorage.getItem("user"));

            if (!user || !user.id) {
                console.error("User not found. Quiz result was not saved.");
                return;
            }

            if (!quizId) {
                console.error("Quiz ID not found. Quiz result was not saved.");
                return;
            }

            const response = await fetch(
                "http://127.0.0.1:8000/quiz/result",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "user-id": String(user.id),
                    },
                    body: JSON.stringify({
                        score: score,
                        total_questions: totalQuestions,
                        quiz_id: quizId,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(
                    "Failed to save quiz result:",
                    data
                );
                return;
            }

            console.log("Quiz result saved:", data);

        } catch (error) {
            console.error(
                "Error saving quiz result:",
                error
            );
        }
    };

    // ==========================
    // Select Quiz Answer
    // ==========================

    const handleAnswerSelect = (questionIndex, answer) => {

        if (quizSubmitted) {
            return;
        }

        setSelectedAnswers({
            ...selectedAnswers,
            [questionIndex]: answer
        });

    };

    // ==========================
    // AI Flashcards
    // ==========================

    const handleGenerateFlashcards = async () => {

        if (!selectedFile) {
            alert("Please upload a document first.");
            return;
        }

        // Get logged-in user
        let user = null;

        try {
            user = JSON.parse(localStorage.getItem("user"));
        } catch (error) {
            console.error("Could not read logged-in user:", error);
        }

        if (!user || !user.id) {
            setFlashcards(
                "❌ Please login again before generating flashcards."
            );
            return;
        }

        setFlashcardLoading(true);

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {

            const response = await fetch(
                "http://127.0.0.1:8000/flashcards",
                {
                    method: "POST",

                    headers: {
                        "user-id": String(user.id),
                    },

                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {

                let errorMessage =
                    "Flashcard generation failed.";

                if (Array.isArray(data.detail)) {

                    errorMessage = data.detail
                        .map(
                            (item) =>
                                item.msg ||
                                JSON.stringify(item)
                        )
                        .join("; ");

                } else if (
                    typeof data.detail === "string"
                ) {

                    errorMessage = data.detail;

                } else if (data.detail) {

                    errorMessage =
                        JSON.stringify(data.detail);
                }

                throw new Error(errorMessage);
            }

            if (!data.flashcards) {
                throw new Error(
                    "The server did not return any flashcards."
                );
            }

            setFlashcards(data.flashcards);

        } catch (error) {

            console.error(
                "Flashcard generation error:",
                error
            );

            setFlashcards(
                `❌ ${error.message ||
                "Flashcard generation failed."
                }`
            );

        } finally {

            setFlashcardLoading(false);

        }
    };

    // ==========================
    // AI Study Planner
    // ==========================

    const handleGenerateStudyPlan = async () => {

        if (!subject || !examDate || !hoursPerDay) {

            alert("Please fill all study planner fields.");

            return;
        }

        setPlannerLoading(true);

        try {

            const response = await fetch(
                "http://127.0.0.1:8000/study-plan",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        subject: subject,
                        exam_date: examDate,
                        hours_per_day: Number(hoursPerDay),
                        document_ids: [Number(documentId)],
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.detail || "Study plan generation failed."
                );
            }

            setStudyPlan(data.study_plan);

        }

        catch (error) {

            console.error(error);

            setStudyPlan(
                `❌ ${error.message || "Failed to generate study plan."}`
            );
        }

        finally {

            setPlannerLoading(false);
        }
    };

    return (

        <div className="upload-container">

            <div className="upload-card">

                {/* ==========================
                    Page Header
                ========================== */}

                <h1>📚 Upload Study Material</h1>

                <p>
                    Upload your study material and learn with AI.
                </p>

                {/* ==========================
                    File Upload
                ========================== */}

                <input
                    type="file"
                    accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                />

                {selectedFile && (

                    <p className="selected-file">
                        📄 Selected: <strong>{selectedFile.name}</strong>
                    </p>

                )}

                <button onClick={handleUpload}>
                    Upload File
                </button>

                {message && (
                    <p className="upload-message">
                        {message}
                    </p>
                )}

                {/* ==========================
                    AI Summary
                ========================== */}

                {summary && (

                    <div className="summary-box">

                        <h2>🤖 AI Summary</h2>

                        <div className="formatted-content summary-content">

                            <ReactMarkdown>
                                {summary}
                            </ReactMarkdown>

                        </div>

                    </div>

                )}

                {/* ==========================
                    AI Tutor
                ========================== */}

                {text && (

                    <div className="summary-box">

                        <h2>🎓 Ask StudySphere AI Tutor</h2>

                        <input
                            type="text"
                            placeholder="Ask anything about your uploaded notes..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />

                        <button onClick={handleAsk}>

                            {loading
                                ? "Thinking..."
                                : "Ask AI"}

                        </button>

                        {answer && (

                            <div className="answer-box">

                                <h3>🤖 AI Tutor Response</h3>

                                <div className="formatted-content answer-content">

                                    <ReactMarkdown>
                                        {answer}
                                    </ReactMarkdown>

                                </div>

                            </div>

                        )}

                    </div>

                )}


                {/* ==========================
    AI Quiz Generator
========================== */}

                {text && (

                    <div className="summary-box quiz-container">

                        <h2>📝 AI Quiz Generator</h2>

                        {!quiz && (

                            <>
                                <p className="quiz-instruction">
                                    Select one answer for each question.
                                </p>

                                <button
                                    type="button"
                                    onClick={handleGenerateQuiz}
                                    disabled={quizLoading}
                                >
                                    {quizLoading
                                        ? "Generating Quiz..."
                                        : "Generate Quiz"}
                                </button>
                            </>

                        )}

                        {quiz && (

                            <div className="interactive-quiz">

                                {quiz
                                    .split(/QUESTION\s+\d+:/i)
                                    .slice(1)
                                    .map((questionBlock, index) => {

                                        const parts =
                                            questionBlock.split(
                                                /CORRECT ANSWER:/i
                                            );

                                        const questionPart =
                                            parts[0];

                                        const correctAnswer =
                                            parts.length > 1
                                                ? parts[1]
                                                    .trim()
                                                    .split(/\s+/)[0]
                                                    .charAt(0)
                                                    .toUpperCase()
                                                : "";

                                        const lines =
                                            questionPart
                                                .split("\n")
                                                .map(line =>
                                                    line.trim()
                                                )
                                                .filter(line =>
                                                    line
                                                );

                                        const questionText =
                                            lines[0];

                                        const options =
                                            lines.filter(line =>
                                                /^[A-D]\)/i.test(line)
                                            );

                                        return (

                                            <div
                                                className="quiz-question"
                                                key={index}
                                            >

                                                <div className="quiz-question-number">
                                                    Question {index + 1}
                                                </div>

                                                <div className="question-text">
                                                    {questionText}
                                                </div>

                                                <div className="quiz-options">

                                                    {options.map(
                                                        (option) => {

                                                            const letter =
                                                                option
                                                                    .charAt(0)
                                                                    .toUpperCase();

                                                            const optionText =
                                                                option
                                                                    .substring(2)
                                                                    .trim();

                                                            const isSelected =
                                                                selectedAnswers[index] ===
                                                                letter;

                                                            const isCorrect =
                                                                correctAnswer ===
                                                                letter;

                                                            let optionClass =
                                                                "quiz-option";

                                                            /*
                                                             * BEFORE SUBMIT
                                                             */
                                                            if (
                                                                !quizSubmitted &&
                                                                isSelected
                                                            ) {

                                                                optionClass +=
                                                                    " selected";

                                                            }

                                                            /*
                                                             * AFTER SUBMIT
                                                             */
                                                            if (quizSubmitted) {

                                                                /*
                                                                 * Correct answer
                                                                 */
                                                                if (isCorrect) {

                                                                    optionClass +=
                                                                        " correct";

                                                                }

                                                                /*
                                                                 * User selected wrong answer
                                                                 */
                                                                if (
                                                                    isSelected &&
                                                                    !isCorrect
                                                                ) {

                                                                    optionClass +=
                                                                        " incorrect";

                                                                }

                                                            }

                                                            return (

                                                                <button
                                                                    type="button"
                                                                    key={letter}
                                                                    className={optionClass}
                                                                    disabled={
                                                                        quizSubmitted
                                                                    }
                                                                    onClick={() =>
                                                                        handleAnswerSelect(
                                                                            index,
                                                                            letter
                                                                        )
                                                                    }
                                                                >

                                                                    <span className="option-letter">
                                                                        {letter})
                                                                    </span>

                                                                    <span>
                                                                        {optionText}
                                                                    </span>

                                                                    {quizSubmitted &&
                                                                        isCorrect && (

                                                                            <span className="answer-icon">
                                                                                ✓
                                                                            </span>

                                                                        )}

                                                                    {quizSubmitted &&
                                                                        isSelected &&
                                                                        !isCorrect && (

                                                                            <span className="answer-icon">
                                                                                ✗
                                                                            </span>

                                                                        )}

                                                                </button>

                                                            );

                                                        }
                                                    )}

                                                </div>

                                            </div>

                                        );

                                    })}

                                {!quizSubmitted && (

                                    <button
                                        type="button"
                                        className="submit-quiz-button"
                                        onClick={handleSubmitQuiz}
                                    >
                                        ✅ Submit Quiz
                                    </button>

                                )}

                                {quizSubmitted && (

                                    <div className="quiz-result">

                                        <h2>
                                            🎯 Quiz Completed!
                                        </h2>

                                        <p>
                                            Your Score:
                                            <strong>
                                                {" "}
                                                {quizScore} / 10
                                            </strong>
                                        </p>

                                        <p>
                                            Percentage:
                                            <strong>
                                                {" "}
                                                {Math.round(
                                                    (quizScore / 10) * 100
                                                )}%
                                            </strong>
                                        </p>

                                        {/* Generate Another Quiz */}

                                        <button
                                            type="button"
                                            className="another-quiz-button"
                                            onClick={() => {
                                                setQuiz(null);
                                                setQuizId(null);
                                                setQuizSubmitted(false);
                                                setQuizScore(0);
                                                setSelectedAnswers({});
                                            }}
                                        >
                                            🔄 Generate Another Quiz
                                        </button>

                                    </div>

                                )}

                            </div>

                        )}

                    </div>

                )}
                {/* ==========================
                    AI Flashcards
                ========================== */}

                {text && (

                    <div className="flashcard-box">

                        <h2>🃏 AI Flashcards</h2>

                        <button
                            type="button"
                            onClick={handleGenerateFlashcards}
                        >
                            {flashcardLoading
                                ? "Generating..."
                                : "Generate Flashcards"}
                        </button>

                        {flashcards && (

                            <div className="flashcard-content">

                                {flashcards
                                    .split(/(?=FLASHCARD\s*\d+)/i)
                                    .filter(card => card.trim())
                                    .map((card, index) => {

                                        const lines = card
                                            .split("\n")
                                            .map(line => line.trim())
                                            .filter(line => line);

                                        const title = lines[0];

                                        const questionLine =
                                            lines.find(line =>
                                                /^Question\s*:/i.test(line)
                                            );

                                        const answerLine =
                                            lines.find(line =>
                                                /^Answer\s*:/i.test(line)
                                            );

                                        const question = questionLine
                                            ? questionLine
                                                .replace(
                                                    /^Question\s*:/i,
                                                    ""
                                                )
                                                .trim()
                                            : "";

                                        const answer = answerLine
                                            ? answerLine
                                                .replace(
                                                    /^Answer\s*:/i,
                                                    ""
                                                )
                                                .trim()
                                            : "";

                                        return (

                                            <div
                                                className="flashcard"
                                                key={index}
                                            >

                                                <h3 className="flashcard-heading">
                                                    🃏 {title}
                                                </h3>

                                                {question && (

                                                    <div className="flashcard-question">

                                                        <strong>
                                                            Question
                                                        </strong>

                                                        <p>
                                                            {question}
                                                        </p>

                                                    </div>

                                                )}

                                                {answer && (

                                                    <div className="flashcard-answer">

                                                        <strong>
                                                            Answer
                                                        </strong>

                                                        <p>
                                                            {answer}
                                                        </p>

                                                    </div>

                                                )}

                                            </div>

                                        );

                                    })}

                            </div>

                        )}

                    </div>

                )}

                {/* ==========================
    AI Study Planner
========================== */}

                <div className="summary-box">

                    <h2>📅 AI Study Planner</h2>

                    <input
                        type="text"
                        placeholder="Subject"
                        value={subject}
                        onChange={(e) =>
                            setSubject(e.target.value)
                        }
                    />

                    <input
                        type="date"
                        value={examDate}
                        onChange={(e) =>
                            setExamDate(e.target.value)
                        }
                    />

                    <input
                        type="number"
                        placeholder="Study Hours Per Day"
                        value={hoursPerDay}
                        onChange={(e) =>
                            setHoursPerDay(e.target.value)
                        }
                    />

                    <button
                        type="button"
                        onClick={handleGenerateStudyPlan}
                    >
                        {plannerLoading
                            ? "Generating..."
                            : "Generate Study Plan"}
                    </button>

                    {studyPlan && (

                        <div className="answer-box">

                            <h3>
                                📅 Personalized Study Plan
                            </h3>

                            <div className="formatted-content answer-content">

                                <ReactMarkdown>
                                    {studyPlan}
                                </ReactMarkdown>

                            </div>

                        </div>

                    )}

                </div>

                {/* ==========================
                    Extracted Text
                ========================== */}

                {text && (

                    <div className="pdf-text">

                        <h2>
                            📄 Extracted Text
                        </h2>

                        <div className="extracted-text-content">

                            <ReactMarkdown>
                                {text}
                            </ReactMarkdown>

                        </div>

                    </div>

                )}

            </div>

        </div>
    );
}

export default Upload;