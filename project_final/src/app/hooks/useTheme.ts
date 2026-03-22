import { useState, useEffect } from "react";

export function useTheme() {
    const [dark, setDark] = useState<boolean>(() => {
        return localStorage.getItem("theme") === "dark";
    });

    useEffect(() => {
        const root = document.documentElement;
        if (dark) {
            root.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            root.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [dark]);

    const toggle = () => setDark(d => !d);

    return { dark, toggle };
}
