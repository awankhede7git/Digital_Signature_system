import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const StudentRequest = () => {
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
    } catch (error) {
      console.error("Error submitting request", error);
      setMessage("Failed to submit request. Please try again.");
    }
  };

  // Redirect to Upload Document Page
  const handleUpload = () => {
    navigate("/upload");
  };

  return (
    <div>
      <h2>Submit a Request</h2>
      <form onSubmit={handleSubmit}>
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

      {message && <p>{message}</p>}
    </div>
  );
};

export default StudentRequest;


//things to be done (Aveena):
//add log of all requests sent
//remove the login andd register thing 
