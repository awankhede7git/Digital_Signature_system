import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student"); // Default role as student
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // Hook for navigation

  const handleRegister = async () => {
    const response = await fetch("http://127.0.0.1:5000/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await response.json();
    setMessage(data.message);

    if (data.success) {
      // Redirect based on role after successful registration
      if (role === "faculty") {
        navigate("/login");
      } else {
        navigate("/login");
      }
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <select onChange={(e) => setRole(e.target.value)} value={role}>
        <option value="student">Student</option>
        <option value="faculty">Faculty</option>
      </select>
      <button onClick={handleRegister}>Register</button>
      <p>{message}</p>
    </div>
  );
}

export default Register;
