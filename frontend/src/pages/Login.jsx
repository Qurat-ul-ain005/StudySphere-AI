import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(
                "http://127.0.0.1:8000/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(
                    data.detail ||
                    "Login failed. Please check your email and password."
                );
                return;
            }

            // Save login information
            localStorage.setItem("token", "loggedin");

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            setMessage("Login successful!");

            // Go to Dashboard
            navigate("/dashboard");

        } catch (error) {
            console.error(error);
            setMessage("Cannot connect to the server.");
        }
    };

    return (
        <div className="login-container">

            <div className="login-card">

                <h1>Welcome Back</h1>

                <p>Login to StudySphere AI</p>

                <form onSubmit={handleLogin}>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        required
                    />

                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        required
                    />

                    <button type="submit">
                        Login
                    </button>

                </form>

                {message && (
                    <p className="login-message">
                        {message}
                    </p>
                )}

            </div>

        </div>
    );
}

export default Login;