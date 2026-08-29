import { Link } from "react-router-dom";
import type { IconType } from "react-icons";

import styles from "./NavItem.module.css";

interface NavItemProps {
  icon: IconType;
  /** Omitted for standalone entries; supplied to number items within a group. */
  index?: number;
  text: string;
  href: string;
}

const NavItem = ({ icon: Icon, index, text, href }: NavItemProps) => {
  return (
    <li>
      <div className={styles.navItem}>
        <span className={styles.iconWrapper}>
          <Icon />
        </span>
        <Link to={href}>
          {`${index !== undefined ? index + 1 : ""} ${text}`}
        </Link>
      </div>
    </li>
  );
};

export default NavItem;
