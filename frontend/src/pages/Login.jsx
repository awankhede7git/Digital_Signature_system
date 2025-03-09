import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [role, setRole] = useState(""); // Store user role

  const handleLogin = async () => {
    const response = await fetch("http://127.0.0.1:5000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (data.success) {
      setMessage("Login successful!");
      setRole(data.role); // Set user role
      localStorage.setItem("token", data.token); // Store token for authentication
      localStorage.setItem("role", data.role); // Store role for role-based access
    } else {
      setMessage(data.message);
      setRole(""); // Reset role on failed login
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
      <p>{message}</p>
      {role && <p>Logged in as: {role}</p>} {/* Display user role */}
    </div>
  );
}

export default Login;
