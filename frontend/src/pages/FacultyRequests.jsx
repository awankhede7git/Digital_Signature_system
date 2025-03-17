import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const FacultyRequests = () => {
    const [requests, setRequests] = useState([]);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://127.0.0.1:5000/api/faculty/requests", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRequests(res.data.requests);
            } catch (err) {
                setError("Failed to fetch requests. Please try again.");
                console.error("Error fetching requests:", err);
            }
        };
        fetchRequests();
    }, []);

    const handleApprove = async (requestId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                "http://127.0.0.1:5000/api/faculty/approve",
                { request_id: requestId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(res.data.message);
            navigate(`/esign/${requestId}`); // Redirect to eSign page
        } catch (err) {
            console.error("Error approving request:", err);
            alert("Failed to approve request.");
        }
    };

    return (
        <div>
            <h2>Faculty Requests</h2>
            {error && <p>{error}</p>}
            <ul>
                {requests.length > 0 ? (
                    requests.map((req) => (
                        <li key={req.id}>
                            <p><strong>Student ID:</strong> {req.student_id}</p>
                            <p><strong>Title:</strong> {req.title}</p>
                            <p><strong>Description:</strong> {req.description}</p>
                            <p>
                                <strong>Document:</strong>{" "}
                                <a href={req.document_url} target="_blank" rel="noopener noreferrer">
                                    View
                                </a>
                            </p>
                            <button onClick={() => handleApprove(req.id)}>Approve & eSign</button>
                        </li>
                    ))
                ) : (
                    <p>No pending requests.</p>
                )}
            </ul>
        </div>
    );
};

export default FacultyRequests;
