import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
<<<<<<< Updated upstream
import StudentRequests from "./pages/StudentRequest";
=======
import StudentRequest from "./pages/StudentRequest";
import FileUpload from "./pages/fileupload";
>>>>>>> Stashed changes
import './App.css';

function App() {
  return (
    <Router>
      <div>
        <h2>Welcome to the App</h2>
        <nav>
          <Link to="/register">Register</Link> | <Link to="/login">Login</Link>
        </nav>

        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
<<<<<<< Updated upstream
          <Route path="/student-requests" element={<StudentRequests />} />
=======
          <Route path="/student-requests" element={<StudentRequest />} />
          <Route path="/upload" element={<FileUpload />} />
          
          {/* Default route to Login */}
          <Route path="*" element={<Login />} />
>>>>>>> Stashed changes
        </Routes>
      </div>
    </Router>
  );
}

export default App;
