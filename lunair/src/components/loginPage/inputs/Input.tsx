import { X, Check } from "lucide-react";
import styles from "./input.module.css";
import { ReactNode } from "react";

type InputProps = {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEnter?: () => void;
  value?: string;
  content?: ReactNode;
};

export default function Input({
  onChange,
  value,
  onEnter,
  content,
}: InputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onEnter?.();
    }
  };
  return (
    <div className={styles.wrapper}>
      <input
        className={styles.input}
        placeholder="Try it"
        onChange={onChange}
        onKeyDown={handleKeyDown}
      />
      {content}
    </div>
  );
}