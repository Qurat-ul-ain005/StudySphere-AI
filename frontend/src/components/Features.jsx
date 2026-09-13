import "./Features.css";

function Features() {
    return (
        <section className="features">

            <h2>Our AI Features</h2>

            <div className="feature-container">

                <div className="feature-card">
                    <h3>AI Summary</h3>
                    <p>Generate short summaries from PDFs and notes.</p>
                </div>

                <div className="feature-card">
                    <h3>Quiz Generator</h3>
                    <p>Create MCQs automatically from study material.</p>
                </div>

                <div className="feature-card">
                    <h3>Flashcards</h3>
                    <p>Create smart flashcards for quick revision.</p>
                </div>

                <div className="feature-card">
                    <h3>AI Explanation</h3>
                    <p>Understand difficult concepts in simple language.</p>
                </div>

                <div className="feature-card">
                    <h3>Question Answering</h3>
                    <p>Ask questions directly from uploaded documents.</p>
                </div>

                <div className="feature-card">
                    <h3>Study Planner</h3>
                    <p>Generate personalized study schedules.</p>
                </div>

            </div>

        </section>
    );
}

export default Features;