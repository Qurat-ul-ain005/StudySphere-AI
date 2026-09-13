import { useState } from "react";
import "./Flashcards.css";

function Flashcards() {
    const [file, setFile] = useState(null);
    const [cards, setCards] = useState([]);
    const [currentCard, setCurrentCard] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const parseFlashcards = (text) => {
        const parsed = [];

        // Split whenever a new "Question:" starts
        const sections = text.split(/(?=Question:)/i);

        sections.forEach((section) => {
            const questionMatch = section.match(
                /Question:\s*(.*?)(?=\s*Answer:)/is
            );

            const answerMatch = section.match(
                /Answer:\s*(.*?)(?=\s*Question:|$)/is
            );

            if (questionMatch && answerMatch) {
                const question = questionMatch[1]
                    .trim()
                    .replace(/\*\*/g, "");

                const answer = answerMatch[1]
                    .trim()
                    .replace(/\*\*/g, "");

                parsed.push({
                    question,
                    answer,
                });
            }
        });

        return parsed;
    };
    const handleGenerateFlashcards = async () => {
        if (!file) {
            setError("Please select a supported file first.");
            return;
        }

        setLoading(true);
        setError("");
        setCards([]);
        setCurrentCard(0);
        setShowAnswer(false);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const savedUser = localStorage.getItem("user");

            if (!savedUser) {
                throw new Error("User session not found. Please log in again.");
            }

            const user = JSON.parse(savedUser);

            if (!user.id) {
                throw new Error("User ID not found. Please log in again.");
            }

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
                const errorMessage =
                    typeof data.detail === "string"
                        ? data.detail
                        : data.detail
                            ? JSON.stringify(data.detail)
                            : "Failed to generate flashcards.";

                throw new Error(errorMessage);
            }

            const parsedCards = parseFlashcards(data.flashcards);

            if (parsedCards.length === 0) {
                throw new Error(
                    "Could not read the generated flashcards."
                );
            }

            setCards(parsedCards);

        } catch (err) {
            console.error(err);
            setError(
                err.message ||
                "Unable to generate flashcards."
            );
        } finally {
            setLoading(false);
        }
    };

    const nextCard = () => {
        if (currentCard < cards.length - 1) {
            setCurrentCard(currentCard + 1);
            setShowAnswer(false);
        }
    };

    const previousCard = () => {
        if (currentCard > 0) {
            setCurrentCard(currentCard - 1);
            setShowAnswer(false);
        }
    };

    return (
        <div className="flashcards-page">

            <div className="flashcards-container">

                <h1>🃏 AI Flashcards</h1>

                <p className="flashcards-intro">
                    Upload your study material and let StudySphere AI
                    create smart flashcards for revision.
                </p>

                {/* Upload */}

                <div className="flashcards-upload">

                    <input
                        type="file"
                        accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg"
                        onChange={(e) => {
                            setFile(e.target.files[0]);
                            setError("");
                        }}
                    />

                    {file && (
                        <p>
                            Selected file:{" "}
                            <strong>{file.name}</strong>
                        </p>
                    )}

                    <button
                        onClick={handleGenerateFlashcards}
                        disabled={loading}
                    >
                        {loading
                            ? "Creating Flashcards..."
                            : "Generate Flashcards"}
                    </button>

                    {error && (
                        <div className="flashcards-error">
                            {error}
                        </div>
                    )}

                </div>

                {/* Flashcard */}

                {cards.length > 0 && (
                    <div className="flashcard-section">

                        <div className="progress">
                            Card {currentCard + 1} of {cards.length}
                        </div>

                        <div
                            className={`flashcard ${showAnswer ? "show-answer" : ""
                                }`}
                            onClick={() =>
                                setShowAnswer(!showAnswer)
                            }
                        >

                            {!showAnswer ? (
                                <>
                                    <span className="card-label">
                                        QUESTION
                                    </span>

                                    <h2>
                                        {cards[currentCard].question}
                                    </h2>

                                    <p className="click-hint">
                                        Click to show answer
                                    </p>
                                </>
                            ) : (
                                <>
                                    <span className="card-label">
                                        ANSWER
                                    </span>

                                    <h2>
                                        {cards[currentCard].answer}
                                    </h2>

                                    <p className="click-hint">
                                        Click to show question
                                    </p>
                                </>
                            )}

                        </div>

                        <div className="flashcard-controls">

                            <button
                                onClick={previousCard}
                                disabled={currentCard === 0}
                            >
                                ← Previous
                            </button>

                            <button
                                onClick={() =>
                                    setShowAnswer(!showAnswer)
                                }
                            >
                                {showAnswer
                                    ? "Show Question"
                                    : "Show Answer"}
                            </button>

                            <button
                                onClick={nextCard}
                                disabled={
                                    currentCard === cards.length - 1
                                }
                            >
                                Next →
                            </button>

                        </div>

                    </div>
                )}

            </div>

        </div>
    );
}

export default Flashcards;