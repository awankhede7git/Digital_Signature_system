import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentRequests from "./pages/StudentRequest";
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
          <Route path="/student-requests" element={<StudentRequests />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
