import React, { useState, useEffect } from "react";
import axios from "axios";

const FacultyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const facultyId = localStorage.getItem("faculty_id");

  useEffect(() => {
    if (!facultyId) {
      setError("Faculty ID not found. Please log in again.");
      return;
    }

    axios
      .get(`http://127.0.0.1:5000/api/faculty/requests/${facultyId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((response) => {
        console.log("Faculty Requests Response:", response.data);
        setRequests(response.data);
      })
      .catch((error) => {
        console.error("Error fetching faculty requests:", error);
        setError("Failed to load requests.");
      });
  }, [facultyId]);

  // const handleSignDocument = async (requestId) => {
  //   setLoading(true);
  //   try {
  //     const response = await axios.post(
  //       `http://127.0.0.1:5000/api/faculty/esign/${requestId}`,
  //       {},
  //       {
  //         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  //       }
  //     );
  //     alert(response.data.message || "Document signed successfully!");
      
  //     setRequests((prevRequests) =>
  //       prevRequests.map((req) =>
  //         req.id === requestId ? { ...req, status: "signed" } : req
  //       )
  //     );
  //   } catch (error) {
  //     console.error("Error signing document:", error);
  //     alert("Failed to sign document.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div>
      <h2>Faculty Requests</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <table border="1">
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Student Email</th>
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
              <td>{request.student_email}</td>
              <td>
                <a href={request.document_url} target="_blank" rel="noopener noreferrer">
                  View Document
                </a>
              </td>
              <td>{request.status}</td>
              <td>{new Date(request.created_at).toLocaleString()}</td>
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

// const FacultyRequests = () => {
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // Get faculty ID from localStorage
//   const facultyId = localStorage.getItem("user_id");

//   useEffect(() => {
//     if (!facultyId) {
//       setError("Faculty ID not found. Please log in again.");
//       return;
//     }

//     axios
//       .get(`http://127.0.0.1:5000/api/faculty/requests/${facultyId}`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
//       })
//       .then((response) => setRequests(response.data))
//       .catch((error) => {
//         console.error("Error fetching faculty requests:", error);
//         setError("Failed to load requests.");
//       });
//   }, [facultyId]);

//   const handleSign = async (requestId) => {
//     setLoading(true);
//     setError("");

//     try {
//       const response = await axios.post(
//         "http://127.0.0.1:5000/api/faculty/esign",
//         { request_id: requestId },
//         {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
//         }
//       );

//       alert(response.data.message);

//       // Update UI: Change status to 'sent_for_signing'
//       setRequests((prevRequests) =>
//         prevRequests.map((req) =>
//           req.id === requestId ? { ...req, status: "sent_for_signing" } : req
//         )
//       );
//     } catch (error) {
//       console.error("Error signing document:", error);
//       setError("Failed to initiate signing.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const checkSignatureStatus = async (envelopeId) => {
//     try {
//       const response = await axios.get(
//         `http://127.0.0.1:5000/api/check-signature-status/${envelopeId}`,
//         {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
//         }
//       );
//       alert(response.data.message);
//     } catch (error) {
//       console.error("Error checking signature status:", error);
//       alert("Failed to check signature status.");
//     }
//   };

//   return (
//     <div className="requests-container">
//       <h2>Faculty Requests</h2>

//       {error && <p className="error-message">{error}</p>}

//       <table>
//         <thead>
//           <tr>
//             <th>Student</th>
//             <th>Document</th>
//             <th>Status</th>
//             <th>Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {requests.map((req) => (
//             <tr key={req.id}>
//               <td>{req.student_email}</td>
//               <td>
//                 <a
//                   href={`http://127.0.0.1:5000/${req.document_url}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                 >
//                   View Document
//                 </a>
//               </td>
//               <td>{req.status}</td>
//               <td>
//                 {req.status === "approved" && (
//                   <button onClick={() => handleSign(req.id)} disabled={loading}>
//                     {loading ? "Signing..." : "Sign Document"}
//                   </button>
//                 )}
//                 {req.status === "sent_for_signing" && (
//                   <button onClick={() => checkSignatureStatus(req.envelope_id)}>
//                     Check Status
//                   </button>
//                 )}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default FacultyRequests;
// //`http://127.0.0.1:5000/api/faculty/requests/${facultyId}`