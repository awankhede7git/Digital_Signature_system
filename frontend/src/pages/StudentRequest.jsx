<<<<<<< Updated upstream
import React, { useState, useEffect } from "react";
=======
import React, { useState } from "react";
>>>>>>> Stashed changes
import { useNavigate } from "react-router-dom";
import axios from "axios";

const StudentRequest = () => {
<<<<<<< Updated upstream
  const [facultyList, setFacultyList] = useState([]);
  const [facultyId, setFacultyId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Fetch faculty list from database
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:5000/api/faculty/list");
        setFacultyList(res.data.faculty);
      } catch (error) {
        console.error("Error fetching faculty list:", error);
      }
    };
    fetchFaculty();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://127.0.0.1:5000/api/student/request",
        { faculty_id: facultyId, title, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      setFacultyId("");
      setTitle("");
      setDescription("");
=======
  const [facultyId, setFacultyId] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); // Clear previous messages

    try {
      // Assuming API call succeeds
      await axios.post("http://127.0.0.1:5000/api/submit_request", {
        faculty_id: facultyId,
        document_url: documentUrl
      });

      setMessage("Request submitted successfully!");

      // Clear form fields
      setFacultyId("");
      setDocumentUrl("");

      // Redirect to File Upload page
      navigate("/upload");
>>>>>>> Stashed changes
    } catch (error) {
      console.error("Error submitting request", error);
      setMessage("Failed to submit request. Please try again.");
    }
  };

<<<<<<< Updated upstream
  // Redirect to Upload Document Page
  const handleUpload = () => {
    navigate("/upload");
  };

=======
>>>>>>> Stashed changes
  return (
    <div>
      <h2>Submit a Request</h2>
      <form onSubmit={handleSubmit}>
<<<<<<< Updated upstream
        <label>Faculty Name:</label>
        <select value={facultyId} onChange={(e) => setFacultyId(e.target.value)} required>
          <option value="">Select Faculty</option>
          {facultyList.map((faculty) => (
            <option key={faculty.id} value={faculty.id}>
              {faculty.email}
            </option>
          ))}
        </select>

        <label>Request Title:</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label>Description:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />

        <button type="submit">Submit Request</button>
      </form>

      <button onClick={handleUpload}>Upload Document</button>

=======
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
>>>>>>> Stashed changes
      {message && <p>{message}</p>}
    </div>
  );
};

export default StudentRequest;


//things to be done (Aveena):
//add log of all requests sent
//remove the login andd register thing 
