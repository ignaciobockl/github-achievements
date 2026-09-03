import { useCallback, useEffect, useState } from "react";
import { getStoredTheme, setStoredTheme, type Theme } from "../theme/theme";

const themes: Theme[] = ["light", "dark", "auto"];

interface ThemeToggleProps {
  labels: Record<Theme, string>;
  label: string;
}

export function ThemeToggle({ labels, label }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("auto");

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  const handleChange = useCallback((next: Theme) => {
    setTheme(next);
    setStoredTheme(next);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="theme-toggle" className="text-sm font-medium opacity-80">
        {label}
      </label>
      <select
        id="theme-toggle"
        value={theme}
        onChange={(event) => handleChange(event.target.value as Theme)}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
      >
        {themes.map((value) => (
          <option key={value} value={value}>
            {labels[value]}
          </option>
        ))}
      </select>
    </div>
  );
}
