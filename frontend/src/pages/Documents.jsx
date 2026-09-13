import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Documents.css";

function Documents() {
    const navigate = useNavigate();

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem("user");

        if (!savedUser) {
            navigate("/login");
            return;
        }

        const user = JSON.parse(savedUser);

        fetch("http://127.0.0.1:8000/dashboard/documents", {
            headers: {
                "user-id": user.id
            }
        })
            .then((response) => response.json())
            .then((data) => {
                const sortedDocuments = (data.documents || []).sort(
                    (a, b) =>
                        new Date(b.uploaded_at || 0) -
                        new Date(a.uploaded_at || 0)
                );

                setDocuments(sortedDocuments);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error loading documents:", error);
                setLoading(false);
            });
    }, [navigate]);

    return (
        <div className="documents-page">

            <header className="documents-header">
                <div>
                    <h1>Document History</h1>
                    <p>
                        View all your uploaded study materials.
                    </p>
                </div>

                <button
                    className="back-dashboard-btn"
                    onClick={() => navigate("/dashboard")}
                >
                    ← Dashboard
                </button>
            </header>

            <main className="documents-container">

                {loading ? (
                    <div className="documents-message">
                        Loading documents...
                    </div>
                ) : documents.length === 0 ? (
                    <div className="documents-message">
                        <div className="documents-empty-icon">
                            📚
                        </div>

                        <h2>No documents yet</h2>

                        <p>
                            Upload your first study material to see it here.
                        </p>

                        <button
                            className="view-all-btn"
                            onClick={() => navigate("/documents")}
                        >
                            View All →
                        </button>
                    </div>
                ) : (
                    <div className="documents-history-list">

                        {documents.map((document) => (
                            <div
                                className="history-document-card"
                                key={document.id}
                            >

                                <div className="history-document-icon">
                                    📄
                                </div>

                                <div className="history-document-info">

                                    <h3>
                                        {document.filename}
                                    </h3>

                                    <p>
                                        Uploaded study material
                                    </p>

                                    {document.uploaded_at && (
                                        <small>
                                            Uploaded:{" "}
                                            {new Date(
                                                document.uploaded_at
                                            ).toLocaleDateString()}
                                        </small>
                                    )}

                                </div>

                                <button
                                    className="history-study-plan-btn"
                                    onClick={() =>
                                        navigate(
                                            `/study-plan?document=${document.id}`
                                        )
                                    }
                                >
                                    Create Study Plan
                                </button>

                            </div>
                        ))}

                    </div>
                )}

            </main>
        </div>
    );
}

export default Documents;