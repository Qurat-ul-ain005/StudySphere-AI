import { useEffect, useState } from "react";
import "./DashboardPreview.css";

function DashboardPreview() {
    const [stats, setStats] = useState({
        documents: 0,
        summaries: 0,
        quizzes: 0,
        flashcards: 0,
    });

    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const savedUser = localStorage.getItem("user");

                if (!savedUser) {
                    return;
                }

                const user = JSON.parse(savedUser);

                if (!user?.id) {
                    return;
                }

                const headers = {
                    "user-id": String(user.id),
                };

                // Get real dashboard statistics
                const statsResponse = await fetch(
                    "http://127.0.0.1:8000/dashboard/stats",
                    {
                        headers,
                    }
                );

                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();

                    setStats({
                        documents: statsData.documents || 0,
                        summaries: statsData.summaries || 0,
                        quizzes: statsData.quizzes || 0,
                        flashcards: statsData.flashcards || 0,
                    });
                }

                // Get real quiz history
                const historyResponse = await fetch(
                    "http://127.0.0.1:8000/dashboard/quiz-history",
                    {
                        headers,
                    }
                );

                if (historyResponse.ok) {
                    const historyData =
                        await historyResponse.json();

                    const history = historyData.history || [];

                    if (history.length > 0) {
                        const averagePercentage =
                            history.reduce(
                                (sum, quiz) =>
                                    sum + Number(quiz.percentage || 0),
                                0
                            ) / history.length;

                        setProgress(
                            Math.round(averagePercentage)
                        );
                    } else {
                        setProgress(0);
                    }
                }
            } catch (error) {
                console.error(
                    "Dashboard preview error:",
                    error
                );
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <section className="dashboard-preview">

            <h2>Your Learning Dashboard</h2>

            <div className="dashboard-box">

                <div className="dashboard-card">
                    <h3>Uploaded Files</h3>
                    <p>{stats.documents}</p>
                </div>

                <div className="dashboard-card">
                    <h3>Summaries</h3>
                    <p>{stats.summaries}</p>
                </div>

                <div className="dashboard-card">
                    <h3>Quizzes</h3>
                    <p>{stats.quizzes}</p>
                </div>

                <div className="dashboard-card">
                    <h3>Flashcards</h3>
                    <p>{stats.flashcards}</p>
                </div>

                <div className="dashboard-card">
                    <h3>Study Progress</h3>
                    <p>{progress}%</p>
                </div>

            </div>

        </section>
    );
}

export default DashboardPreview;