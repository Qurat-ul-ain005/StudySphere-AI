import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import StudyPlan from "./pages/StudyPlan";
import Documents from "./pages/Documents";
import Quiz from "./pages/Quiz";
import Flashcards from "./pages/Flashcards";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/study-plan" element={<StudyPlan />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/flashcards" element={<Flashcards />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;