import React, { useState, useEffect } from "react";
import axios from "axios";

const FacultyRequests = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:5000/api/faculty/requests", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      .then((response) => {
        setRequests(response.data);
      })
      .catch((error) => {
        console.error("Error fetching faculty requests:", error);
      });
  }, []);

  return (
    <div className="requests-container">
      <h2>Faculty Requests</h2>
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Document</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.id}>
              <td>{req.student_email}</td>
              <td>
                <a href={`http://127.0.0.1:5000/${req.document_url}`} target="_blank" rel="noopener noreferrer">
                  View Document
                </a>
              </td>
              <td>{req.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FacultyRequests;
