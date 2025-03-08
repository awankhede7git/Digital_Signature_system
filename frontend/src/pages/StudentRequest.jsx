import React, { useState } from "react";
import axios from "axios";

const StudentRequest = () => {
    const [facultyId, setFacultyId] = useState("");
    const [documentUrl, setDocumentUrl] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(""); // Clear previous messages

        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                "http://127.0.0.1:5000/api/submit_request",
                { faculty_id: facultyId, document_url: documentUrl },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage(res.data.message);
            setFacultyId("");
            setDocumentUrl("");
        } catch (error) {
            console.error("Error submitting request", error);
            setMessage("Failed to submit request. Please try again.");
        }
    };

    return (
        <div>
            <h2>Submit a Request</h2>
            <form onSubmit={handleSubmit}>
                <label>Faculty ID:</label>
                <input 
                    type="text" 
                    value={facultyId} 
                    onChange={(e) => setFacultyId(e.target.value)} 
                    required 
                />
                <label>Document URL:</label>
                <input 
                    type="text" 
                    value={documentUrl} 
                    onChange={(e) => setDocumentUrl(e.target.value)} 
                    required 
                />
                <button type="submit">Submit Request</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default StudentRequest;
