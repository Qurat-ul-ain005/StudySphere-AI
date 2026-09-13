import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);

    // Temporary dashboard statistics
    // These will be connected to FastAPI in the next step.
    const [stats, setStats] = useState({
        documents: 0,
        quizzes: 0,
        flashcards: 0,
        studyPlans: 0,
    });

    const [recentDocuments, setRecentDocuments] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [recommendation, setRecommendation] = useState(null);
    const [difficultyPrediction, setDifficultyPrediction] = useState(null);
    const [quizHistory, setQuizHistory] = useState([]);
    const [showProgress, setShowProgress] = useState(false);

    const averagePercentage =
        quizHistory.length > 0
            ? Math.round(
                quizHistory.reduce(
                    (sum, quiz) => sum + quiz.percentage,
                    0
                ) / quizHistory.length
            )
            : 0;

    const bestPercentage =
        quizHistory.length > 0
            ? Math.max(...quizHistory.map((quiz) => quiz.percentage))
            : 0;

    const totalQuizzes = quizHistory.length;

    useEffect(() => {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        if (!token || !savedUser) {
            navigate("/login");
            return;
        }

        const user = JSON.parse(savedUser);

        setUser(user);

        const fetchStats = async () => {
            try {
                const response = await fetch(
                    "http://127.0.0.1:8000/dashboard/stats",
                    {
                        headers: {
                            "user-id": String(user.id),
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.detail || "Failed to load dashboard statistics."
                    );
                }

                setStats(data);

                const documentsResponse = await fetch(
                    "http://127.0.0.1:8000/dashboard/documents",
                    {
                        headers: {
                            "user-id": String(user.id),
                        },
                    }
                );

                const documentsData = await documentsResponse.json();

                if (!documentsResponse.ok) {
                    throw new Error(
                        documentsData.detail ||
                        "Failed to load study materials."
                    );
                }

                setRecentDocuments(documentsData.documents);

                setRecentActivity(
                    documentsData.documents.map((document) => ({
                        id: document.id,
                        icon: "📄",
                        title: "Study Material Uploaded",
                        description: document.filename,
                    }))
                );

                const recommendationResponse = await fetch(
                    "http://127.0.0.1:8000/dashboard/recommendations",
                    {
                        headers: {
                            "user-id": String(user.id),
                        },
                    }
                );

                if (recommendationResponse.ok) {
                    const recommendationData =
                        await recommendationResponse.json();

                    setRecommendation(recommendationData);
                }

                const difficultyResponse = await fetch(
                    "http://127.0.0.1:8000/dashboard/difficulty",
                    {
                        headers: {
                            "user-id": String(user.id),
                        },
                    }
                );

                if (difficultyResponse.ok) {
                    const difficultyData =
                        await difficultyResponse.json();

                    setDifficultyPrediction(difficultyData);
                }

                const historyResponse = await fetch(
                    "http://127.0.0.1:8000/dashboard/quiz-history",
                    {
                        headers: {
                            "user-id": String(user.id),
                        },
                    }
                );

                if (historyResponse.ok) {
                    const historyData =
                        await historyResponse.json();

                    setQuizHistory(
                        (historyData.history || []).map((quiz) => ({
                            ...quiz,
                            score: Number(quiz.score || 0),
                            total_questions: Number(quiz.total_questions || 0),
                            percentage: Number(quiz.percentage || 0),
                        }))
                    );
                }

            } catch (error) {
                console.error("Dashboard stats error:", error);
            }
        };

        fetchStats();

    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <div className="dashboard-page">

            {/* Header */}
            <header className="dashboard-header">

                <div className="logo">
                    🧠 StudySphere <span>AI</span>
                </div>

                <button
                    className="logout-btn"
                    onClick={handleLogout}
                >
                    🚪 Logout
                </button>

            </header>


            {/* Main Content */}
            <main className="dashboard-container">

                {/* Welcome Section */}
                <section className="welcome-section">

                    <p className="welcome-small">
                        Your AI-powered learning workspace
                    </p>

                    <h1>
                        👋 Welcome, {user?.name || "Student"}!
                    </h1>

                    <p>
                        Learn smarter, organize your studies, and let AI
                        help you achieve your academic goals.
                    </p>

                </section>


                {/* Statistics */}
                <section className="stats-grid">

                    <div className="stat-card">
                        <div className="stat-icon">📄</div>

                        <div>
                            <h3>{stats.documents}</h3>
                            <p>Documents</p>
                        </div>
                    </div>


                    <div className="stat-card">
                        <div className="stat-icon">📝</div>

                        <div>
                            <h3>{stats.quizzes}</h3>
                            <p>Quizzes</p>
                        </div>
                    </div>


                    <div className="stat-card">
                        <div className="stat-icon">🃏</div>

                        <div>
                            <h3>{stats.flashcards}</h3>
                            <p>Flashcards</p>
                        </div>
                    </div>


                    <div className="stat-card">
                        <div className="stat-icon">📅</div>

                        <div>
                            <h3>{stats.studyPlans}</h3>
                            <p>Study Plans</p>
                        </div>
                    </div>

                </section>


                {/* Quick Actions */}
                <section className="dashboard-section">

                    <div className="section-heading">
                        <div>
                            <h2>Quick Actions</h2>

                            <p>
                                Start studying with your AI learning assistants.
                            </p>
                        </div>
                    </div>


                    <div className="quick-actions">

                        <button
                            className="quick-action-btn"
                            onClick={() => navigate("/upload")}
                        >
                            📄 Upload Material
                        </button>


                        <button
                            className="quick-action-btn"
                            onClick={() => navigate("/quiz")}
                        >
                            📝 Generate Quiz
                        </button>


                        <button
                            className="quick-action-btn"
                            onClick={() => navigate("/flashcards")}
                        >
                            🃏 Create Flashcards
                        </button>


                        <button
                            className="quick-action-btn"
                            onClick={() => navigate("/study-plan")}
                        >
                            📅 Create Study Plan
                        </button>

                    </div>

                </section>


                {/* Recent Study Materials */}
                <section className="dashboard-section">

                    <div className="section-heading">

                        <div>
                            <h2>Recent Study Materials</h2>

                            <p>
                                Your recently uploaded learning materials.
                            </p>
                        </div>

                        <button
                            className="view-all-btn"
                            onClick={() => navigate("/documents")}
                        >
                            View All →
                        </button>

                    </div>


                    <div className="recent-materials">

                        {recentDocuments.length === 0 ? (

                            <div className="empty-state">

                                <div className="empty-icon">
                                    📚
                                </div>

                                <h3>No study materials yet</h3>

                                <p>
                                    Upload your first PDF, DOCX, or PPTX document
                                    to start learning with StudySphere AI.
                                </p>

                                <button
                                    onClick={() => navigate("/upload")}
                                >
                                    Upload Material
                                </button>

                            </div>

                        ) : (

                            <div className="documents-list">

                                {recentDocuments.map((document) => (

                                    <div
                                        className="document-item"
                                        key={document.id}
                                    >

                                        <div className="document-icon">
                                            📄
                                        </div>

                                        <div className="document-info">
                                            <h3>{document.filename}</h3>
                                            <p>
                                                Uploaded study material
                                            </p>

                                            {document.uploaded_at && (
                                                <small>
                                                    Uploaded:{" "}
                                                    {new Date(document.uploaded_at).toLocaleDateString()}
                                                </small>
                                            )}
                                        </div>
                                        <button
                                            className="document-action-btn"
                                            onClick={() => navigate(`/study-plan?document=${document.id}`)}
                                        >
                                            Create Study Plan
                                        </button>

                                    </div>

                                ))}

                            </div>

                        )}

                    </div>

                </section>


                {/* Recent AI Activity */}
                <section className="dashboard-section">

                    <div className="section-heading">
                        <div>
                            <h2>Recent AI Activity</h2>

                            <p>
                                Your latest learning activities.
                            </p>
                        </div>
                    </div>

                    <div className="activity-list">

                        {recentActivity.length === 0 ? (

                            <div className="activity-item">

                                <div className="activity-icon">
                                    🤖
                                </div>

                                <div>
                                    <h3>No activity yet</h3>

                                    <p>
                                        Upload study material to start using
                                        StudySphere AI.
                                    </p>
                                </div>

                            </div>

                        ) : (

                            recentActivity.map((activity) => (

                                <div
                                    className="activity-item"
                                    key={activity.id}
                                >

                                    <div className="activity-icon">
                                        {activity.icon}
                                    </div>

                                    <div>
                                        <h3>{activity.title}</h3>

                                        <p>
                                            {activity.description}
                                        </p>
                                    </div>

                                </div>

                            ))

                        )}

                    </div>

                </section>


                {/* Personalized Recommendation */}

                {recommendation && (
                    <section className="dashboard-section">

                        <div className="section-heading">
                            <div>
                                <h2>🎯 Personalized Study Recommendation</h2>

                                <p>
                                    Recommendations based on your quiz performance.
                                </p>
                            </div>
                        </div>

                        <div className="recommendation-card">

                            <div className="recommendation-icon">
                                🎯
                            </div>

                            <div className="recommendation-content">

                                <h3>
                                    Your Average Performance
                                </h3>

                                <div className="recommendation-score">
                                    {recommendation.average_percentage}%
                                </div>

                                {recommendation.weakest_material && (
                                    <p>
                                        <strong>Material to review:</strong>{" "}
                                        {recommendation.weakest_material}
                                    </p>
                                )}

                                <p>
                                    {recommendation.recommendation}
                                </p>

                            </div>

                        </div>

                    </section>
                )}


                {/* ML QUIZ DIFFICULTY PREDICTION */}

                {difficultyPrediction?.available && (
                    <section className="dashboard-section">

                        <div className="section-heading">
                            <div>
                                <h2>🤖 AI Quiz Difficulty Prediction</h2>

                                <p>
                                    Machine learning analysis of your latest quiz performance.
                                </p>
                            </div>
                        </div>

                        <div className="difficulty-card">

                            <div className="difficulty-icon">
                                🤖
                            </div>

                            <div className="difficulty-content">

                                <h3>
                                    Predicted Quiz Difficulty
                                </h3>

                                <div className="difficulty-result">
                                    {difficultyPrediction.difficulty}
                                </div>

                                <p>
                                    Your quiz score:
                                    {" "}
                                    <strong>
                                        {difficultyPrediction.percentage}%
                                    </strong>
                                </p>

                                <p>
                                    Score:
                                    {" "}
                                    <strong>
                                        {difficultyPrediction.score}
                                        /
                                        {difficultyPrediction.total_questions}
                                    </strong>
                                </p>

                                <p>
                                    ML prediction confidence:
                                    {" "}
                                    <strong>
                                        {difficultyPrediction.confidence}%
                                    </strong>
                                </p>

                            </div>

                        </div>

                    </section>
                )}


                {/* Previous Quiz Sessions */}
                <section className="dashboard-section">

                    <div className="section-heading">
                        <div>
                            <h2>📚 Previous Quiz Sessions</h2>

                            <p>
                                Review your previous quiz performance.
                            </p>
                        </div>
                    </div>

                    <div className="quiz-history">

                        {quizHistory.length === 0 ? (

                            <div className="empty-state">

                                <div className="empty-icon">
                                    📚
                                </div>

                                <h3>No quiz sessions yet</h3>

                                <p>
                                    Complete a quiz to see your previous
                                    sessions here.
                                </p>

                                <button
                                    onClick={() => navigate("/quiz")}
                                >
                                    Generate Quiz
                                </button>

                            </div>

                        ) : (

                            <div className="quiz-history-list">

                                {quizHistory.map((session) => (

                                    <div
                                        className="quiz-history-item"
                                        key={session.id}
                                    >

                                        <div className="quiz-history-icon">
                                            📝
                                        </div>

                                        <div className="quiz-history-info">

                                            <h3>
                                                {session.filename}
                                            </h3>

                                            <p>
                                                Score:{" "}
                                                <strong>
                                                    {session.score}
                                                    /
                                                    {session.total_questions}
                                                </strong>
                                            </p>

                                        </div>

                                        <div className="quiz-history-percentage">

                                            {session.percentage}%

                                        </div>

                                    </div>

                                ))}

                            </div>

                        )}

                    </div>

                </section>


                {/* Feature Cards */}
                <section className="dashboard-section">

                    <div className="section-heading">

                        <div>
                            <h2>AI Learning Assistants</h2>

                            <p>
                                Choose an AI assistant to continue your studies.
                            </p>

                        </div>

                    </div>


                    <div className="features-grid">

                        {/* Upload */}
                        <div className="feature-card">

                            <div className="feature-icon">
                                📄
                            </div>

                            <h2>Study Materials</h2>

                            <p>
                                Upload your PDF, DOCX, or PPTX study materials
                                and let StudySphere AI analyze them for you.
                            </p>

                            <button
                                onClick={() => navigate("/upload")}
                            >
                                Upload Material →
                            </button>

                        </div>


                        {/* AI Tutor */}
                        <div className="feature-card">

                            <div className="feature-icon">
                                🤖
                            </div>

                            <h2>AI Tutor</h2>

                            <p>
                                Ask questions about your study material
                                and get AI-powered explanations.
                            </p>

                            <button
                                onClick={() => navigate("/upload")}
                            >
                                Ask AI Tutor →
                            </button>

                        </div>


                        {/* Quiz */}
                        <div className="feature-card">

                            <div className="feature-icon">
                                📝
                            </div>

                            <h2>AI Quiz Generator</h2>

                            <p>
                                Generate quizzes from your uploaded
                                study material to test your knowledge.
                            </p>

                            <button
                                onClick={() => navigate("/quiz")}
                            >
                                Generate Quiz →
                            </button>

                        </div>


                        {/* Flashcards */}
                        <div className="feature-card">

                            <div className="feature-icon">
                                🃏
                            </div>

                            <h2>AI Flashcards</h2>

                            <p>
                                Create smart flashcards from your notes
                                for quick revision.
                            </p>

                            <button
                                onClick={() => navigate("/flashcards")}
                            >
                                Create Flashcards →
                            </button>

                        </div>


                        {/* Study Planner */}
                        <div className="feature-card">

                            <div className="feature-icon">
                                📅
                            </div>

                            <h2>AI Study Planner</h2>

                            <p>
                                Create a personalized study schedule
                                based on your exam date and available time.
                            </p>

                            <button
                                onClick={() => navigate("/study-plan")}
                            >
                                Create Study Plan →
                            </button>

                        </div>


                        {/* Progress */}
                        <div className="feature-card">

                            <div className="feature-icon">
                                📊
                            </div>

                            <h2>Learning Progress</h2>

                            <p>
                                Track your learning activity and improve
                                your weak topics over time.
                            </p>

                            <div className="progress-summary">

                                <div>
                                    <strong>{averagePercentage}%</strong>
                                    <span>Average Score</span>
                                </div>

                                <div>
                                    <strong>{bestPercentage}%</strong>
                                    <span>Best Score</span>
                                </div>

                                <div>
                                    <strong>{totalQuizzes}</strong>
                                    <span>Quizzes Taken</span>
                                </div>

                            </div>

                            <button
                                onClick={() => setShowProgress(true)}
                            >
                                View Progress →
                            </button>

                        </div>

                    </div>

                </section>


                {/* Progress Modal */}
                {showProgress && (
                    <div className="progress-modal-overlay">

                        <div className="progress-modal">

                            <div className="progress-modal-header">

                                <div>
                                    <h2>Learning Progress</h2>

                                    <p>
                                        Review your quiz performance and learning progress.
                                    </p>
                                </div>

                                <button
                                    className="progress-close-button"
                                    onClick={() => setShowProgress(false)}
                                >
                                    ×
                                </button>

                            </div>


                            {quizHistory.length === 0 ? (

                                <div className="progress-empty">

                                    <h3>No quiz results yet</h3>

                                    <p>
                                        Complete a quiz to start tracking your learning progress.
                                    </p>

                                </div>

                            ) : (

                                <>

                                    <div className="progress-details-grid">

                                        <div className="progress-detail-card">
                                            <strong>{averagePercentage}%</strong>
                                            <span>Average Score</span>
                                        </div>

                                        <div className="progress-detail-card">
                                            <strong>{bestPercentage}%</strong>
                                            <span>Best Score</span>
                                        </div>

                                        <div className="progress-detail-card">
                                            <strong>{totalQuizzes}</strong>
                                            <span>Quizzes Taken</span>
                                        </div>

                                    </div>


                                    <div className="quiz-history-section">

                                        <h3>Quiz Performance History</h3>

                                        <div className="quiz-history-list">

                                            {quizHistory.map((quiz, index) => (

                                                <div
                                                    className="quiz-history-item"
                                                    key={index}
                                                >

                                                    <div>
                                                        <strong>
                                                            {quiz.filename || `Quiz ${index + 1}`}
                                                        </strong>
                                                        <span>
                                                            Score:{" "}
                                                            {quiz.score}
                                                            {" / "}
                                                            {quiz.total_questions}
                                                        </span>
                                                    </div>

                                                    <strong>
                                                        {quiz.percentage}%
                                                    </strong>

                                                </div>

                                            ))}

                                        </div>

                                    </div>

                                </>

                            )}


                            <button
                                className="progress-done-button"
                                onClick={() => setShowProgress(false)}
                            >
                                Close
                            </button>

                        </div>

                    </div>
                )}

            </main>

        </div>
    );
}

export default Dashboard;




