import React, { useState, useEffect } from "react";
import axios from "axios";

const backendUrl = "http://127.0.0.1:5000"; // Define backend URL here

const FacultyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);

  const facultyId = localStorage.getItem("faculty_id");

  useEffect(() => {
    if (!facultyId) {
      setError("Faculty ID not found. Please log in again.");
      return;
    }

    axios
      .get(`${backendUrl}/api/faculty/requests/${facultyId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((response) => setRequests(response.data))
      .catch((error) => {
        console.error("Error fetching faculty requests:", error);
        setError("Failed to load requests.");
      });
  }, [facultyId]);

  // Function to update request status
  const handleStatusToggle = async (requestId, currentStatus) => {
    const newStatus = currentStatus === "pending" ? "approved" : "pending";

    try {
      await axios.patch(
        `${backendUrl}/api/update-request-status/${requestId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      // Update UI Optimistically
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId ? { ...req, status: newStatus } : req
        )
      );
    } catch (error) {
      console.error("Error updating request status:", error);
      alert("Failed to update status.");
    }
  };

  return (
    <div>
      <h2>Faculty Requests</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <table border="1">
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Student email</th>
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
              <td>{request.student_email || request.student_id}</td>
              <td>
                <a
                  href={`${backendUrl}/view-document/${request.document_url.split("\\").pop()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Document
                </a>
                <button
                  onClick={() =>
                    window.open(
                      `${backendUrl}/download-document/${request.document_url.split("\\").pop()}`,
                      "_blank"
                    )
                  }
                >
                  Download Document
                </button>
              </td>
              <td>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={request.status === "approved"}
                    onChange={() => handleStatusToggle(request.id, request.status)}
                  />
                  <span className="slider"></span>
                </label>
                <span> {request.status} </span>
              </td>
              <td>
                {request.created_at
                  ? new Date(request.created_at).toLocaleString()
                  : "Not Available"}
              </td>
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

// import React, { useState, useEffect } from "react";
// import axios from "axios";

// const backendUrl = "http://127.0.0.1:5000"; // Define backend URL here

// const FacultyRequests = () => {
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const facultyId = localStorage.getItem("faculty_id");

//   useEffect(() => {
//     if (!facultyId) {
//       setError("Faculty ID not found. Please log in again.");
//       return;
//     }

//     axios
//       .get(`${backendUrl}/api/faculty/requests/${facultyId}`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//       })
//       .then((response) => {
//         console.log("Faculty Requests Response:", response.data);
//         setRequests(response.data);
//       })
//       .catch((error) => {
//         console.error("Error fetching faculty requests:", error);
//         setError("Failed to load requests.");
//       });
//   }, [facultyId]);

//   return (
//     <div>
//       <h2>Faculty Requests</h2>
//       {error && <p style={{ color: "red" }}>{error}</p>}
//       <table border="1">
//         <thead>
//           <tr>
//             <th>Request ID</th>
//             <th>Student email</th>
//             <th>Document</th>
//             <th>Status</th>
//             <th>Created At</th>
//             <th>Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//         {requests.map((request) => (
//   <tr key={request.id}>
//     <td>{request.id}</td>
//     <td>{request.student_email || request.student_id}</td>
//     <td>
//       <a
//         href={`${backendUrl}/view-document/${request.document_url.split("\\").pop()}`}
//         target="_blank"
//         rel="noopener noreferrer"
//       >
//         View Document
//       </a>
//       <button
//         onClick={() =>
//           window.open(
//             `${backendUrl}/download-document/${request.document_url.split("\\").pop()}`,
//             "_blank"
//           )
//         }
//       >
//         Download Document
//       </button>
//     </td>
//     <td>
//       <label className="switch">
//         <input
//           type="checkbox"
//           checked={request.status === "completed"}
//           onChange={() => handleStatusToggle(request.id, request.status)}
//         />
//         <span className="slider"></span>
//       </label>
//       <span> {request.status} </span>
//     </td>
//     <td>{request.created_at ? new Date(request.created_at).toLocaleString() : "Not Available"}</td>
//     <td>
//       {request.status === "pending" ? (
//         <a
//           href={`https://docusign.com/sign?documentId=${request.id}`}
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <button>Sign Document</button>
//         </a>
//       ) : (
//         "Already Signed"
//       )}
//     </td>
//   </tr>
// ))}

//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default FacultyRequests;
