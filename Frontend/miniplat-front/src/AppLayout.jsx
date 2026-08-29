import { BrowserRouter as Router, useNavigate } from "react-router-dom";
import App from "./App";
import { UserProvider, useUser } from "./contexts/UserContext";

const AppLayout = () => {
  const { signOut } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    signOut();
    navigate("/home");
  };

  return <App onLogout={handleLogout} />;
};

const AppWrapper = () => (
  <Router>
    <UserProvider>
      <AppLayout />
    </UserProvider>
  </Router>
);

export default AppWrapper;
