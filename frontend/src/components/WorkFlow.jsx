import "./WorkFlow.css";

function WorkFlow() {
    return (

        <section className="workflow">

            <h2>How StudySphere AI Works</h2>

            <div className="workflow-container">

                <div className="step">
                    <div className="icon">📄</div>
                    <h3>Upload Notes</h3>
                    <p>Upload PDF, PPT, DOCX or Images.</p>
                </div>

                <div className="arrow">➜</div>

                <div className="step">
                    <div className="icon">🤖</div>
                    <h3>AI Reads</h3>
                    <p>Our AI understands your study material.</p>
                </div>

                <div className="arrow">➜</div>

                <div className="step">
                    <div className="icon">🧠</div>
                    <h3>Select AI Agent</h3>
                    <p>Choose Summary, Quiz, Flashcards or Planner.</p>
                </div>

                <div className="arrow">➜</div>

                <div className="step">
                    <div className="icon">🎯</div>
                    <h3>Get Results</h3>
                    <p>Receive summaries, quizzes and explanations instantly.</p>
                </div>

            </div>

        </section>

    );
}

export default WorkFlow;