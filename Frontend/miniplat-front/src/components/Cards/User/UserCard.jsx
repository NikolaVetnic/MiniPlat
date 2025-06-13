import { useEffect, useState } from "react";

import { fetchUserInfo } from "../../../services/authService";
import sr from "../../../locales/sr.json";
import styles from "./UserCard.module.css";

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME;

const UserCard = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  const cpt = sr.components.cards.user;
  const token = localStorage.getItem("token");

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const data = await fetchUserInfo(token);
        setUserInfo(data);
      } catch (err) {
        console.error(err);
        setError("Unable to fetch user information.");
      }
    };

    if (token) {
      getUserInfo();
    }
  }, [token]);

  if (error) {
    return (
      <section className={styles.userCard}>
        <p>{error}</p>
      </section>
    );
  }

  if (!userInfo) {
    return (
      <section className={styles.userCard}>
        <p>{cpt.loading}</p>
      </section>
    );
  }

  return (
    <section className={styles.userCard}>
      <ul>
        <li>
          <strong>{cpt.lecturer}:</strong>{" "}
          {`${userInfo.title} ${userInfo.firstName} ${userInfo.lastName}`}
        </li>
        <li>
          <strong>{cpt.department}:</strong> {userInfo.department}
        </li>
        <li>
          <strong>{cpt.email}:</strong>{" "}
          <a href={`mailto:${userInfo.email}`}>{userInfo.email}</a>
        </li>
        {userInfo.username == ADMIN_USERNAME ? (
          <></>
        ) : (
          <li>
            <strong>{sr.captions.institution}</strong>
          </li>
        )}
      </ul>
    </section>
  );
};

export default UserCard;
