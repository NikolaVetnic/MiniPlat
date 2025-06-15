import { Link } from "react-router-dom";

import styles from "./NavItem.module.css";

const NavItem = ({ icon: Icon, text, href }) => {
  return (
    <li>
      <div className={styles.navItem}>
        <span className={styles.iconWrapper}>
          <Icon />
        </span>
        <Link to={href}>{text}</Link>
      </div>
    </li>
  );
};

export default NavItem;
