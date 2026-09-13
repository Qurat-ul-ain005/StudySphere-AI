import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./StudyPlan.css";

function StudyPlan() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [documents, setDocuments] = useState([]);
    const [selectedDocuments, setSelectedDocuments] = useState([]);

    const [subject, setSubject] = useState("");
    const [examDate, setExamDate] = useState("");
    const [hoursPerDay, setHoursPerDay] = useState("");

    const [studyPlan, setStudyPlan] = useState("");
    const [message, setMessage] = useState("");

    const [documentsLoading, setDocumentsLoading] = useState(true);
    const [loading, setLoading] = useState(false);

    // =========================================================
    // FETCH USER'S UPLOADED DOCUMENTS
    // =========================================================

    useEffect(() => {
        const fetchDocuments = async () => {
            setDocumentsLoading(true);
            setMessage("");

            try {
                const savedUser = localStorage.getItem("user");

                if (!savedUser) {
                    setMessage("User session not found. Please login again.");
                    return;
                }

                const user = JSON.parse(savedUser);

                if (!user || !user.id) {
                    setMessage("User information not found. Please login again.");
                    return;
                }

                console.log("Loading documents for user:", user.id);

                const controller = new AbortController();

                const timeout = setTimeout(() => {
                    controller.abort();
                }, 10000);

                const response = await fetch(
                    "http://127.0.0.1:8000/dashboard/documents",
                    {
                        method: "GET",
                        headers: {
                            "user-id": String(user.id),
                        },
                        signal: controller.signal,
                    }
                );

                clearTimeout(timeout);

                console.log("Documents API status:", response.status);

                const data = await response.json();

                console.log("STUDY PLAN RESPONSE:", data);
                console.log("STUDY PLAN DETAIL:", data.detail);
                console.log("STUDY PLAN TYPE:", typeof data.detail);

                console.log("Documents API response:", data);

                if (!response.ok) {
                    setMessage(
                        typeof data.detail === "string"
                            ? data.detail
                            : "Could not load your study documents."
                    );
                    return;
                }

                setDocuments(
                    Array.isArray(data.documents)
                        ? data.documents
                        : []
                );

                const selectedDocumentId = Number(searchParams.get("document"));

                if (selectedDocumentId) {
                    setSelectedDocuments([selectedDocumentId]);
                }

            } catch (error) {
                console.error("Document loading error:", error);

                if (error.name === "AbortError") {
                    setMessage(
                        "The server took too long to respond. Please restart the backend."
                    );
                } else {
                    setMessage("Could not connect to the server.");
                }

            } finally {
                setDocumentsLoading(false);
            }
        };

        fetchDocuments();
    }, []);

    // =========================================================
    // HANDLE DOCUMENT SELECTION
    // =========================================================

    const handleDocumentSelection = (documentId) => {
        setSelectedDocuments((previous) => {
            if (previous.includes(documentId)) {
                return previous.filter((id) => id !== documentId);
            }

            return [...previous, documentId];
        });

        // Clear previous generated plan when selection changes
        setStudyPlan("");
        setMessage("");
    };

    // =========================================================
    // GENERATE STUDY PLAN
    // =========================================================

    const generatePlan = async () => {
        if (selectedDocuments.length === 0) {
            setMessage("Please select at least one study document.");
            return;
        }

        if (!subject || !examDate || !hoursPerDay) {
            setMessage("Please fill in all fields.");
            return;
        }

        const savedUser = localStorage.getItem("user");

        if (!savedUser) {
            setMessage("User session not found. Please login again.");
            return;
        }

        let user;

        try {
            user = JSON.parse(savedUser);
        } catch (error) {
            console.error(error);
            setMessage("Invalid user session. Please login again.");
            return;
        }

        if (!user || !user.id) {
            setMessage("User information not found. Please login again.");
            return;
        }

        setLoading(true);
        setMessage("");
        setStudyPlan("");

        try {
            const response = await fetch(
                "http://127.0.0.1:8000/study-plan",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "user-id": String(user.id),
                    },
                    body: JSON.stringify({
                        subject: subject,
                        exam_date: examDate,
                        hours_per_day: Number(hoursPerDay),
                        document_ids: selectedDocuments.map((id) => Number(id)),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(
                    typeof data.detail === "string"
                        ? data.detail
                        : "Failed to generate study plan."
                );
                return;
            }

            setStudyPlan(data.study_plan);

        } catch (error) {
            console.error(error);
            setMessage("Could not connect to the server.");

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="study-plan-page">

            <div className="study-plan-container">

                {/* =====================================================
                    HEADER
                ====================================================== */}

                <div className="study-plan-header">

                    <h1>🤖 AI Study Planner</h1>

                    <p>
                        Create a personalized study plan using your
                        uploaded study material.
                    </p>

                </div>


                <div className="study-plan-card">


                    {/* =================================================
                        STUDY MATERIALS
                    ================================================== */}

                    <div className="form-group">

                        <label>
                            Study Materials
                        </label>

                        {documentsLoading ? (

                            <p>
                                Loading your study documents...
                            </p>

                        ) : documents.length === 0 ? (

                            <div className="document-warning">

                                <p>
                                    No uploaded documents found.
                                    Please upload study material first.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => navigate("/upload")}
                                >
                                    Upload Study Material
                                </button>

                            </div>

                        ) : (

                            <div className="document-selection">

                                <p className="selection-help">
                                    Select one or more documents to
                                    include in your study plan.
                                </p>

                                <div className="document-list">

                                    {documents.map((document) => {

                                        const documentId = Number(document.id);

                                        return (
                                            <label
                                                key={document.id}
                                                className={`document-option ${selectedDocuments.includes(documentId)
                                                    ? "selected"
                                                    : ""
                                                    }`}
                                            >
                                                <div className="document-left">

                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDocuments.includes(documentId)}
                                                        onChange={() =>
                                                            handleDocumentSelection(documentId)
                                                        }
                                                    />

                                                    <span className="document-icon">
                                                        {document.filename.toLowerCase().endsWith(".pdf")
                                                            ? "📕"
                                                            : document.filename.toLowerCase().endsWith(".pptx")
                                                                ? "📊"
                                                                : document.filename.toLowerCase().endsWith(".docx")
                                                                    ? "📝"
                                                                    : "📄"}
                                                    </span>

                                                    <span className="document-name">
                                                        {document.filename}
                                                    </span>

                                                </div>

                                                {selectedDocuments.includes(documentId) && (
                                                    <span className="selected-badge">
                                                        ✓ Selected
                                                    </span>
                                                )}
                                            </label>
                                        );

                                    })}

                                </div>

                                <p className="selected-count">
                                    {selectedDocuments.length} document
                                    {selectedDocuments.length !== 1
                                        ? "s"
                                        : ""}{" "}
                                    selected
                                </p>

                            </div>

                        )}

                    </div>


                    {/* =================================================
                        SUBJECT
                    ================================================== */}

                    <div className="form-group">

                        <label htmlFor="subject">
                            Subject
                        </label>

                        <input
                            id="subject"
                            type="text"
                            placeholder="e.g. Machine Learning"
                            value={subject}
                            onChange={(e) =>
                                setSubject(e.target.value)
                            }
                        />

                    </div>


                    {/* =================================================
                        EXAM DATE
                    ================================================== */}

                    <div className="form-group">

                        <label htmlFor="exam-date">
                            Exam Date
                        </label>

                        <input
                            id="exam-date"
                            type="date"
                            value={examDate}
                            onChange={(e) =>
                                setExamDate(e.target.value)
                            }
                        />

                    </div>


                    {/* =================================================
                        STUDY HOURS
                    ================================================== */}

                    <div className="form-group">

                        <label htmlFor="hours-per-day">
                            Study Hours Per Day
                        </label>

                        <input
                            id="hours-per-day"
                            type="number"
                            min="1"
                            max="24"
                            placeholder="e.g. 3"
                            value={hoursPerDay}
                            onChange={(e) =>
                                setHoursPerDay(e.target.value)
                            }
                        />

                    </div>


                    {/* =================================================
                        GENERATE BUTTON
                    ================================================== */}

                    <button
                        className="generate-btn"
                        onClick={generatePlan}
                        disabled={
                            loading ||
                            documentsLoading ||
                            documents.length === 0
                        }
                    >

                        {loading
                            ? "🤖 Generating Your Plan..."
                            : "✨ Generate Study Plan"}

                    </button>


                    {/* =================================================
                        MESSAGE
                    ================================================== */}

                    {message && (

                        <div className="error-message">
                            {message}
                        </div>

                    )}


                    {/* =================================================
                        STUDY PLAN RESULT
                    ================================================== */}

                    {studyPlan && (

                        <div className="plan-result">

                            <h2>
                                📚 Your AI Study Plan
                            </h2>

                            <div className="plan-content">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {studyPlan
                                        .replace(/\\([#*_`])/g, "$1")
                                        .replace(/\\+/g, "")
                                    }
                                </ReactMarkdown>
                            </div>

                        </div>

                    )}


                    {/* =================================================
                        BACK BUTTON
                    ================================================== */}

                    <button
                        className="back-btn"
                        onClick={() => navigate("/dashboard")}
                    >
                        ← Back to Dashboard
                    </button>

                </div>

            </div>

        </div>
    );
}

export default StudyPlan;