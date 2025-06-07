import sr from "../../../locales/sr.json";
import styles from "./UserCard.module.css";

const UserCard = ({ user }) => {
  const cpt = sr.components.cards.user;

  return (
    <section className={styles.userCard}>
      <ul>
        <li>
          <strong>{cpt.firstName}:</strong> {user.firstName}
        </li>
        <li>
          <strong>{cpt.lastName}:</strong> {user.lastName}
        </li>
        <li>
          <strong>{sr.captions.institution}</strong>
        </li>
      </ul>
    </section>
  );
};

export default UserCard;
