import { useEffect, useState } from "react";

import { fetchUserInfo } from "../../../services/authService";
import { useUser } from "../../../contexts/UserContext";
import type { UserInfo } from "../../../types/api";
import styles from "./UserCard.module.css";
import { useI18n } from "../../../i18n/I18nContext";

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME;

const UserCard = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { t } = useI18n();
  const cpt = t.components.cards.user;
  const { token } = useUser();

  useEffect(() => {
    if (!token) return;

    const getUserInfo = async () => {
      try {
        const data = await fetchUserInfo(token);
        setUserInfo(data);
      } catch (err) {
        console.error(err);
        setError(cpt.error);
      }
    };

    void getUserInfo();
  }, [token, cpt.error]);

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

  // Every field comes from a claim and can be absent. Joining the present ones avoids
  // rendering the string "null" where a title or a name is missing.
  const fullName = [userInfo.title, userInfo.firstName, userInfo.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={styles.userCard}>
      <ul>
        <li>
          <strong>{cpt.lecturer}:</strong> {fullName}
        </li>
        <li>
          <strong>{cpt.department}:</strong> {userInfo.department}
        </li>
        <li>
          <strong>{cpt.email}:</strong>{" "}
          <a href={`mailto:${userInfo.email}`}>{userInfo.email}</a>
        </li>
        {userInfo.username !== ADMIN_USERNAME && (
          <li>
            <strong>{t.captions.institution}</strong>
          </li>
        )}
      </ul>
    </section>
  );
};

export default UserCard;
