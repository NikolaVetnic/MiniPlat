import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../../services/authService";
import Navbar from "../../components/Navbar/Navbar";
import sr from "../../locales/sr.json";
import styles from "./LoginPage.module.css";
import { useUser } from "../../contexts/UserContext";

import footerText from "../../utils/footerText";

interface LoginPageProps {
  onLogout: () => void;
}

const LoginPage = ({ onLogout }: LoginPageProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const { user, signIn } = useUser();

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    if (user) {
      navigate(`/${user.username}/home`);
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // simulate delay

      const data = await login(username, password);
      signIn(data.token, data.user);

      navigate(`/${data.user.username}/home`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const cpt = sr.pages.login;

  return (
    <>
      <Navbar onLogout={onLogout} />

      <div className={styles.container}>
        <div className={styles.loginBox}>
          <h1 className={styles.title}>{sr.captions.title}</h1>
          <h2 className={styles.subtitle}>{cpt.header}</h2>

          {isLoading ? (
            <div className={styles.spinnerContainer}>
              <div className={styles.spinner}></div>
              <p>Učitavanje...</p>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)}>
              <input
                type="text"
                placeholder={cpt.placeholders.username}
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <input
                type="password"
                placeholder={cpt.placeholders.password}
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && <p className={styles.error}>{cpt.error}</p>}

              <button type="submit" className={styles.button}>
                {cpt.buttons.login}
              </button>
            </form>
          )}
        </div>

        <footer className={styles.footer}>{footerText}</footer>
      </div>
    </>
  );
};

export default LoginPage;
