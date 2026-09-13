import { useState } from "react";
import "./Quiz.css";

function Quiz() {
    const [file, setFile] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [quizId, setQuizId] = useState(null);
    const [answers, setAnswers] = useState({});
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ==========================================
    // Convert Gemini text into quiz questions
    // ==========================================

    const parseQuiz = (quizText) => {
        if (!quizText || typeof quizText !== "string") {
            return [];
        }

        const parsedQuestions = [];

        const questionBlocks = quizText
            .split(/QUESTION\s+\d+\s*:/i)
            .slice(1);

        questionBlocks.forEach((block) => {
            const questionMatch = block.match(
                /^\s*(.*?)\s*A\)\s*(.*?)\s*B\)\s*(.*?)\s*C\)\s*(.*?)\s*D\)\s*(.*?)\s*CORRECT ANSWER:\s*([ABCD])/is
            );

            if (questionMatch) {
                parsedQuestions.push({
                    question: questionMatch[1].trim(),
                    options: {
                        A: questionMatch[2].trim(),
                        B: questionMatch[3].trim(),
                        C: questionMatch[4].trim(),
                        D: questionMatch[5].trim(),
                    },
                    correctAnswer: questionMatch[6].toUpperCase(),
                });
            }
        });

        console.log("Parsed quiz questions:", parsedQuestions);

        return parsedQuestions;
    };

    // ==========================================
    // Generate Quiz
    // ==========================================

    const handleGenerateQuiz = async () => {
        if (!file) {
            setError("Please select a PDF, DOCX, PPTX, PNG, JPG, or JPEG file first.");
            return;
        }

        setLoading(true);
        setError("");
        setQuestions([]);
        setAnswers({});
        setScore(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const savedUser = localStorage.getItem("user");

            if (!savedUser) {
                setError("Please login again.");
                setLoading(false);
                return;
            }

            const user = JSON.parse(savedUser);

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
                    data.detail || "Failed to generate quiz."
                );
            }

            const parsedQuestions = parseQuiz(data.quiz);

            if (parsedQuestions.length === 0) {
                throw new Error(
                    "Could not read the generated quiz. Please try again."
                );
            }

            setQuizId(data.quiz_id);
            setQuestions(parsedQuestions);

        } catch (err) {
            console.error("Quiz Error:", err);
            setError(
                err.message ||
                "Unable to generate the quiz. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // Select Answer
    // ==========================================

    const handleAnswerSelect = (questionIndex, option) => {
        // Don't allow changes after submitting
        if (score !== null) {
            return;
        }

        setAnswers((previous) => ({
            ...previous,
            [questionIndex]: option,
        }));
    };

    // ==========================================
    // Submit Quiz
    // ==========================================

    const handleSubmitQuiz = async () => {
        if (Object.keys(answers).length < questions.length) {
            setError("Please answer all questions before submitting.");
            return;
        }

        let finalScore = 0;

        questions.forEach((question, index) => {
            if (answers[index] === question.correctAnswer) {
                finalScore++;
            }
        });

        setScore(finalScore);
        setError("");

        try {
            const savedUser = localStorage.getItem("user");

            if (!savedUser) {
                console.warn("User session not found. Quiz result was not saved.");
                return;
            }

            const user = JSON.parse(savedUser);

            if (!user || !user.id) {
                console.warn("User information not found. Quiz result was not saved.");
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
                        score: finalScore,
                        total_questions: questions.length,
                        quiz_id: quizId,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(
                    "Could not save quiz result:",
                    data.detail || "Unknown error"
                );
                return;
            }

            console.log("Quiz result saved:", data);

        } catch (error) {
            console.error("Quiz result save error:", error);
        }
    };
    // ==========================================
    // Reset Quiz
    // ==========================================

    const handleReset = () => {
        setQuestions([]);
        setAnswers({});
        setScore(null);
        setError("");
    };

    // ==========================================
    // Get option class
    // ==========================================

    const getOptionClass = (question, questionIndex, option) => {
        const selectedAnswer = answers[questionIndex];

        // Before submitting
        if (score === null) {
            return selectedAnswer === option
                ? "option selected"
                : "option";
        }

        // After submitting
        if (option === question.correctAnswer) {
            return "option correct";
        }

        if (
            option === selectedAnswer &&
            selectedAnswer !== question.correctAnswer
        ) {
            return "option wrong";
        }

        return "option";
    };

    return (
        <div className="quiz-page">

            <div className="quiz-container">

                {/* Header */}

                <div className="quiz-header">
                    <h1>📝 AI Quiz Generator</h1>

                    <p>
                        Upload your study material and let
                        StudySphere AI generate a 10-question quiz.
                    </p>
                </div>

                {/* Upload Card */}

                <div className="quiz-card">

                    <input
                        type="file"
                        accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg"
                        onChange={(e) => {
                            setFile(e.target.files[0]);
                            setError("");
                            setQuestions([]);
                            setAnswers({});
                            setScore(null);
                        }}
                    />

                    {file && (
                        <p className="selected-file">
                            Selected file:{" "}
                            <strong>{file.name}</strong>
                        </p>
                    )}

                    <button
                        className="generate-btn"
                        onClick={handleGenerateQuiz}
                        disabled={loading}
                    >
                        {loading
                            ? "Generating Quiz..."
                            : "Generate Quiz"}
                    </button>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                </div>

                {/* Score */}

                {score !== null && (
                    <div className="score-card">

                        <h2>🎉 Quiz Completed!</h2>

                        <div className="score">
                            {score} / {questions.length}
                        </div>

                        <p>
                            {score === questions.length
                                ? "Perfect score! Excellent work! 🌟"
                                : score >= questions.length * 0.7
                                    ? "Great job! Keep it up! 👏"
                                    : "Keep practicing. You can improve! 💪"}
                        </p>

                    </div>
                )}

                {/* Questions */}

                {questions.length > 0 && (
                    <div className="questions-container">

                        <div className="quiz-title">
                            <h2>🧠 Your AI Quiz</h2>

                            <p>
                                Select one answer for each question.
                            </p>
                        </div>

                        {questions.map((question, index) => (
                            <div
                                className="question-card"
                                key={index}
                            >

                                <h3>
                                    {index + 1}.{" "}
                                    {question.question}
                                </h3>

                                <div className="options">

                                    {Object.entries(
                                        question.options
                                    ).map(
                                        ([letter, text]) => (
                                            <button
                                                key={letter}
                                                className={getOptionClass(
                                                    question,
                                                    index,
                                                    letter
                                                )}
                                                onClick={() =>
                                                    handleAnswerSelect(
                                                        index,
                                                        letter
                                                    )
                                                }
                                                disabled={
                                                    score !== null
                                                }
                                            >
                                                <span className="option-letter">
                                                    {letter}
                                                </span>

                                                <span>
                                                    {text}
                                                </span>
                                            </button>
                                        )
                                    )}

                                </div>

                                {/* Correct answer after submit */}

                                {score !== null && (
                                    <div className="answer-result">

                                        {answers[index] ===
                                            question.correctAnswer ? (
                                            <span className="correct-text">
                                                ✓ Correct!
                                            </span>
                                        ) : (
                                            <span className="wrong-text">
                                                ✗ Wrong! Correct answer:
                                                {" "}
                                                <strong>
                                                    {
                                                        question.correctAnswer
                                                    }
                                                </strong>
                                            </span>
                                        )}

                                    </div>
                                )}

                            </div>
                        ))}

                        {/* Submit */}

                        {score === null && (
                            <button
                                className="submit-quiz-btn"
                                onClick={handleSubmitQuiz}
                            >
                                Submit Quiz
                            </button>
                        )}

                        {/* Try Again */}

                        {score !== null && (
                            <button
                                className="retry-btn"
                                onClick={handleReset}
                            >
                                Generate Another Quiz
                            </button>
                        )}

                    </div>
                )}

            </div>

        </div>
    );
}

export default Quiz;