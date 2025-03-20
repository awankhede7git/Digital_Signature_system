import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const FileUpload = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { facultyId, title, description } = location.state || {};

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    setLoading(true);
    try {
      // Create a request first
      const token = localStorage.getItem("token");
      const requestRes = await axios.post(
        "http://127.0.0.1:5000/api/student/request",
        { faculty_id: facultyId, title, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const requestId = requestRes.data.request_id;

      // Upload file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("request_id", requestId);

      await axios.post("http://127.0.0.1:5000/api/student/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("File uploaded successfully!");
      navigate("/student-requests");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("File upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload Document</h2>
      <form onSubmit={handleUpload}>
        <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" required />
        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  );
};

export default FileUpload;
