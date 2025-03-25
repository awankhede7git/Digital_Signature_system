import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Get student ID from localStorage
  const studentId = localStorage.getItem("user_id");

  useEffect(() => {
    if (!studentId) {
      setError("Unauthorized access. Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    axios
      .get(`http://127.0.0.1:5000/api/student/dashboard/${studentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      .then((response) => setRequests(response.data))
      .catch((error) => {
        console.error("Error fetching student requests:", error);
        setError("Failed to load requests.");
      });
  }, [studentId, navigate]);

  return (
    <div className="requests-container">
      <h2>Student Dashboard</h2>
      <button onClick={() => navigate("/student-requests")}>Submit New Request</button>

      {error && <p className="error-message">{error}</p>}

      {requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Faculty</th>
              <th>Document</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>{req.faculty_email}</td>
                <td>
                  <a
                    href={`http://127.0.0.1:5000/${req.document_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Document
                  </a>
                </td>
                <td>{req.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StudentDashboard;