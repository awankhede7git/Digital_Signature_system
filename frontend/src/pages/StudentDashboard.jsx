import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const StudentDashboard = () => {
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
        console.error("No token found!");
        return;
      }

    axios
      .get("http://127.0.0.1:5000/api/student_requests", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        console.log("API Response:", response.data);  // Debugging
        setRequests(response.data);
      })
      .catch((error) => {
        console.error("Error fetching student requests:", error.response || error);
      });
  }, []);

  return (
    <div className="dashboard-container">
      <h2>Your Requests</h2>
      {requests.length === 0 ? (
        <p>No requests found. Submit a new request!</p>
      ) : (
        <ul>
          {requests.map((request) => (
            <li key={request.id}>
              <strong>Faculty ID:</strong> {request.faculty_id} | 
              <strong> Document:</strong> <a href={request.document_url} target="_blank" rel="noopener noreferrer">View</a> | 
              <strong> Status:</strong> {request.status} | 
              <strong> Created At:</strong> {new Date(request.created_at).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
      <button onClick={() => navigate("/student-requests")}>
        Submit New Request
      </button>
    </div>
  );
};

export default StudentDashboard;
