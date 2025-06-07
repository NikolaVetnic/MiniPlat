import { Link } from "react-router-dom";

import styles from "./NavItem.module.css";

const NavItem = ({ icon: Icon, text, href }) => {
  return (
    <li>
      <span className={styles.navItem}>
        <Icon />
        <Link to={href}>{text}</Link>
      </span>
    </li>
  );
};

export default NavItem;
