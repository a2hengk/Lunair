import styles from "./button.module.css";
import { ReactNode } from "react";

type ButtonProps = {
  content?: ReactNode;
  color?: "primary" | "secondary";
  border?: string;
  onClick?: () => void;
};

export const Button = ({
  content,
  color = "primary",
  onClick,
  border = "",
}: ButtonProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={`${styles.body} ${styles[color]} ${styles[border]}`}
    >
      {content}
    </button>
  );
};