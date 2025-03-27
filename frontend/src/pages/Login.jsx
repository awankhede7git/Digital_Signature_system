import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection
import "./Login.css";


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [role, setRole] = useState(""); // Store user role
  const navigate = useNavigate(); // Hook for navigation

  const handleLogin = async () => {
    const response = await fetch("http://127.0.0.1:5000/api/login", {
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

      // Store authentication data
      localStorage.setItem("token", data.token); // Store token for authentication
      localStorage.setItem("role", data.role); // Store role for role-based access
      localStorage.setItem("user_id", data.user_id); // Store user ID for later use

      // Redirect based on role
      if (data.role === "faculty") {
        localStorage.setItem("faculty_id", data.user_id); // Store faculty ID for requests
        navigate("/faculty-requests"); // Redirect to FacultyRequests.jsx
      } else {
        localStorage.setItem("student_id", data.user_id);
        navigate("/student-dashboard"); // Redirect to StudentRequests.jsx
      }
    } else {
      setMessage(data.message);
      setRole(""); // Reset role on failed login
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button onClick={handleLogin}>Login</button>
      <p>{message}</p>
      {role && <p>Logged in as: {role}</p>} {/* Display user role */}
    </div>
  );
}

export default Login;
