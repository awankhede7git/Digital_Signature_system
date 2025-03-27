
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./StudentRequests.css";

const StudentRequests = () => {
  const [faculties, setFaculties] = useState([]);
  const [facultyId, setFacultyId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  // Retrieve student ID from local storage or authentication context
  const studentId = localStorage.getItem("student_id"); // Ensure this is correctly set when a student logs in


  useEffect(() => {
    axios.get("http://127.0.0.1:5000/api/faculties")
      .then(response => {
        setFaculties(response.data);
      })
      .catch(error => {
        console.error("Error fetching faculties:", error);
      });
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!facultyId || !title || !description || !file) {
  //     alert("All fields and a file are required!");
  //     return;
  //   }

  //   const formData = new FormData();
  //   formData.append("student_id", studentId);  
  //   formData.append("faculty_id", facultyId);
  //   formData.append("title", title);
  //   formData.append("description", description);
  //   formData.append("file", file);

  //   try {
  //     const response = await axios.post(`http://127.0.0.1:5000/api/student_request/${studentId}`, formData, {
  //       headers: { "Content-Type": "multipart/form-data" }
  //     });
  //     alert(response.data.message);
  //     navigate("/student-dashboard");  // Redirect after submission
  //   } catch (error) {
  //     console.error("Error submitting request:", error);
  //     alert("File upload failed.");
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!facultyId || !title || !description || !file) {
      alert("All fields and a file are required!");
      return;
    }

    const formData = new FormData();
    formData.append("student_id", studentId);  
    formData.append("faculty_id", facultyId);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("file", file);

    try {
      const response = await axios.post(
        `http://127.0.0.1:5000/api/student_request/${studentId}`,  // Send student ID dynamically
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      alert(response.data.message);
      navigate("/student-dashboard");  // Redirect after submission
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("File upload failed.");
    }
  };


  return (
    <div className="request-container">
      <h2>Submit a Request</h2>
      <form onSubmit={handleSubmit}>

        <label>Faculty:</label>
        <select value={facultyId} onChange={(e) => setFacultyId(e.target.value)} required>
          <option value="">Select Faculty</option>
          {faculties.map(faculty => (
            <option key={faculty.id} value={faculty.id}>{faculty.email}</option>
          ))}
        </select>

        <label>Title:</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label>Description:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>

        <label>Upload Document:</label>
        <input type="file" onChange={handleFileChange} required />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default StudentRequests;
