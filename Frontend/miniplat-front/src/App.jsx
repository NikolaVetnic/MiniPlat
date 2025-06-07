import { Routes, Route, Navigate } from "react-router-dom";

import "./App.css";
import LoginPage from "./pages/Login/LoginPage";
import HomePage from "./pages/Home/HomePage";
import PageNotFound from "./pages/NotFound/PageNotFound";
import SubjectPage from "./pages/Subject/SubjectPage";
import { useUser } from "./contexts/UserContext";

function App({ onLogout }) {
  const { user } = useUser(); // grab user from context
  const token = localStorage.getItem("token");
  const isAuthenticated = !!token;

  return (
    <Routes>
      {/* Default route: Go to public home page */}
      <Route path="/" element={<Navigate to="/home" />} />

      {/* Public home route */}
      <Route path="/home" element={<HomePage onLogout={onLogout} />} />

      {/* Login page */}
      <Route path="/login" element={<LoginPage onLogout={onLogout} />} />

      {/* Private home route */}
      <Route
        path="/:username/home"
        element={
          isAuthenticated && user ? (
            <HomePage onLogout={onLogout} />
          ) : (
            <Navigate to="/home" />
          )
        }
      />

      {/* Private subject route */}
      <Route
        path="/:username/subjects/:subjectId"
        element={
          isAuthenticated && user ? (
            <SubjectPage user={user} onLogout={onLogout} />
          ) : (
            <Navigate to="/home" />
          )
        }
      />

      {/* Public subject route */}
      <Route
        path="/subjects/:subjectId"
        element={<SubjectPage user={user} onLogout={onLogout} />}
      />

      {/* Catch-all */}
      <Route path="*" element={<PageNotFound onLogout={onLogout} />} />
    </Routes>
  );
}

export default App;
