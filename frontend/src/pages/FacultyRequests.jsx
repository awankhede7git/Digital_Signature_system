import React, { useEffect, useState } from "react";
import axios from "axios";

const FacultyRequests = () => {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://127.0.0.1:5000/api/faculty/requests", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data.requests);
        } catch (error) {
            console.error("Error fetching requests", error);
        }
    };

    const handleResponse = async (requestId, action) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post("http://127.0.0.1:5000/api/faculty/respond", 
                { request_id: requestId, action },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchRequests(); // Refresh list after responding
        } catch (error) {
            console.error("Error updating request", error);
        }
    };

    return (
        <div>
            <h2>Pending Requests</h2>
            {requests.length === 0 ? (
                <p>No pending requests.</p>
            ) : (
                <ul>
                    {requests.map((req) => (
                        <li key={req.id}>
                            <p>Student ID: {req.student_id}</p>
                            <p>Document: <a href={req.document_url} target="_blank">View</a></p>
                            <button onClick={() => handleResponse(req.id, "approved")}>Approve</button>
                            <button onClick={() => handleResponse(req.id, "rejected")}>Reject</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default FacultyRequests;
