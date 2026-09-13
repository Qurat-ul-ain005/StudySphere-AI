import { useState } from "react";

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleRegister = async (event) => {
        event.preventDefault();

        if (!name || !email || !password) {
            setMessage("Please fill in all fields.");
            return;
        }

        try {
            const response = await fetch(
                "http://127.0.0.1:8000/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        password: password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.detail || "Registration failed.");
                return;
            }

            setMessage("Registration successful! 🎉");

            setName("");
            setEmail("");
            setPassword("");

        } catch (error) {
            console.error(error);
            setMessage(
                "Could not connect to the server."
            );
        }
    };

    return (
        <div style={{
            maxWidth: "500px",
            margin: "60px auto",
            padding: "30px",
            background: "white",
            borderRadius: "15px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
        }}>

            <h1>Create Your Account</h1>

            <p>
                Register for your StudySphere AI account.
            </p>

            <form onSubmit={handleRegister}>

                <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "12px",
                        marginBottom: "15px",
                        boxSizing: "border-box"
                    }}
                />

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "12px",
                        marginBottom: "15px",
                        boxSizing: "border-box"
                    }}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "12px",
                        marginBottom: "15px",
                        boxSizing: "border-box"
                    }}
                />

                <button
                    type="submit"
                    style={{
                        width: "100%",
                        padding: "12px",
                        background: "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer"
                    }}
                >
                    Register
                </button>

            </form>

            {message && (
                <p style={{ marginTop: "20px" }}>
                    {message}
                </p>
            )}

        </div>
    );
}

export default Register;