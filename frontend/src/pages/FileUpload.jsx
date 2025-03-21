import { useState } from "react";

const FileUpload = () => {
    const [file, setFile] = useState(null);
    const [studentId, setStudentId] = useState("");  // Assuming user selects or is logged in
    const [facultyId, setFacultyId] = useState("");
    
    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file || !studentId || !facultyId) {
            alert("Please select a file and enter student & faculty IDs.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("student_id", studentId);
        formData.append("faculty_id", facultyId);

        try {
            const response = await fetch("http://127.0.0.1:5000/api/upload", {
                method: "POST",
                body: formData,  // ✅ Ensures proper format
            });

            const data = await response.json();
            console.log(data);

            if (response.ok) {
                alert("File uploaded successfully!");
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error("Upload failed:", error);
        }
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} />
            <input type="text" placeholder="Student ID" onChange={(e) => setStudentId(e.target.value)} />
            <input type="text" placeholder="Faculty ID" onChange={(e) => setFacultyId(e.target.value)} />
            <button onClick={handleUpload}>Upload</button>
        </div>
    );
};

export default FileUpload;
