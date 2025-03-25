import React, { useState, useEffect } from "react";
import axios from "axios";

const FacultyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const facultyId = localStorage.getItem("faculty_id");

  useEffect(() => {
    if (!facultyId) {
      setError("Faculty ID not found. Please log in again.");
      return;
    }

    axios
      .get(`http://127.0.0.1:5000/api/faculty/requests/${facultyId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((response) => {
        console.log("Faculty Requests Response:", response.data);
        setRequests(response.data);
      })
      .catch((error) => {
        console.error("Error fetching faculty requests:", error);
        setError("Failed to load requests.");
      });
  }, [facultyId]);

  const handleStatusToggle = async (requestId, currentStatus) => {
    const newStatus = currentStatus === "pending" ? "completed" : "pending";
  };

  // const handleSignDocument = async (requestId) => {
  //   setLoading(true);
  //   try {
  //     const response = await axios.post(
  //       `http://127.0.0.1:5000/api/faculty/esign/${requestId}`,
  //       {},
  //       {
  //         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  //       }
  //     );
  //     alert(response.data.message || "Document signed successfully!");
      
  //     setRequests((prevRequests) =>
  //       prevRequests.map((req) =>
  //         req.id === requestId ? { ...req, status: "signed" } : req
  //       )
  //     );
  //   } catch (error) {
  //     console.error("Error signing document:", error);
  //     alert("Failed to sign document.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  

  return (
    <div>
      <h2>Faculty Requests</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <table border="1">
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Student Email</th>
            <th>Document</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>{request.id}</td>
              <td>{request.student_email}</td>
              <td>
                <a href={request.document_url} target="_blank" rel="noopener noreferrer">
                  View Document
                </a>
              </td>
              <td>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={request.status === "completed"}
                    onChange={() => handleStatusToggle(request.id, request.status)}
                  />
                  <span className="slider"></span>
                </label>
                <span> {request.status} </span>
              </td>
              <td>{request.created_at ? new Date(request.created_at).toLocaleString() : "Not Available"}</td>
              <td>
                {request.status === "pending" ? (
                  <a 
                    href={`https://docusign.com/sign?documentId=${request.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <button>Sign Document</button>
                  </a>
                ) : (
                  "Already Signed"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FacultyRequests;