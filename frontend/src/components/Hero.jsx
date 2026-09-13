import "./Hero.css";

function Hero() {
    return (
        <section className="hero">

            <h1>
                One Platform.
                <br />
                Multiple AI Learning Assistants.
            </h1>

            <p>
                Upload your study material and let AI summarize,
                explain concepts, generate quizzes,
                create flashcards and answer your questions.
            </p>

            <div className="hero-buttons">
                <button className="btn-primary">
                    Get Started
                </button>

                <button className="btn-secondary">
                    Learn More
                </button>
            </div>

        </section>
    );
}

export default Hero;