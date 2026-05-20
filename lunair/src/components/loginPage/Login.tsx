import Container from "./container/Container";
import styles from "./login.module.css";
import Input from "./inputs/Input";
import { Button } from "../ui/button/Button";
import { useState } from "react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = () => {
        // placeholder: wire auth when ready
        console.log("submit", { email, password });
    };

    return (
        <Container>
            <div className={styles.card} role="main">
                <div className={styles.brand}>
                    <div className={styles.logo} aria-hidden />
                    <h1 className={styles.title}>Welcome back</h1>
                    <p className={styles.subtitle}>Sign in to continue</p>
                </div>

                <form
                    className={styles.form}
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                >
                    <div className={styles.field}>
                        <label className={styles.label}>Email</label>
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Password</label>
                        <Input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className={styles.actions}>
                        <Button content={"Sign in"} />
                        <Button content={"Create account"} color="secondary" />
                    </div>
                </form>
            </div>
        </Container>
    );
}
