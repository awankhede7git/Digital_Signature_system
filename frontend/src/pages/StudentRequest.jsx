import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const StudentRequests = () => {
  const [faculties, setFaculties] = useState([]);
  const [facultyId, setFacultyId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/api/faculties")
      .then((response) => {
        setFaculties(response.data);
      })
      .catch((error) => {
        console.error("Error fetching faculties:", error);
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!facultyId || !title || !description) {
      alert("All fields are required!");
      return;
    }
    
    navigate("/fileupload", { state: { facultyId, title, description } });
  };

  return (
    <div className="request-container">
      <h2>Submit a Request</h2>
      <form onSubmit={handleSubmit}>
        <label>Faculty:</label>
        <select value={facultyId} onChange={(e) => setFacultyId(e.target.value)} required>
          <option value="">Select Faculty</option>
          {faculties.map((faculty) => (
            <option key={faculty.id} value={faculty.id}>{faculty.email}</option>
          ))}
        </select>

        <label>Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label>Description:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        ></textarea>

        <button type="submit">Next</button>
      </form>
    </div>
  );
};

export default StudentRequests;
