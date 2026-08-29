import { BrowserRouter as Router, useNavigate } from "react-router-dom";

import App from "./App";
import { UserProvider, useUser } from "./contexts/UserContext";
import { I18nProvider } from "./i18n/I18nContext";

const AppLayout = () => {
  const { signOut } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate("/home");
  };

  return <App onLogout={handleLogout} />;
};

const AppWrapper = () => (
  <Router>
    <I18nProvider>
      <UserProvider>
        <AppLayout />
      </UserProvider>
    </I18nProvider>
  </Router>
);

export default AppWrapper;
