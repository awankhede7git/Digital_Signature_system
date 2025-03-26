import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentRequests from "./pages/StudentRequest";
import FacultyRequests from "./pages/FacultyRequests";
import FileUpload from "./pages/FileUpload";
import StudentDashboard from "./pages/StudentDashboard";
import "./App.css";

function App() {
  return (
    <Router>
      <MainContent />
    </Router>
  );
}

function MainContent() {
  const location = useLocation();
  const showNav = location.pathname === "/";

  return (
    <div>
      {showNav && (
        <>
          <h2>Welcome to the Digital Signature System!</h2>
          <nav>
            <Link to="/register">Register</Link> | <Link to="/login">Login</Link>
          </nav>
        </>
      )}

      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student-requests/:studentId" element={<StudentRequests />} />
        <Route path="/faculty-requests" element={<FacultyRequests />} />
        <Route path="/fileupload" element={<FileUpload />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
      </Routes>
    </div>
  );
}

export default App;
