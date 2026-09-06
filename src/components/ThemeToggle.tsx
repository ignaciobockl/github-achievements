import { useCallback, useEffect, useState } from "react";
import { getStoredTheme, setStoredTheme, type Theme } from "../theme/theme";

const themes: Theme[] = ["auto", "light", "dark"];

const arrowSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

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

  const selectStyle: React.CSSProperties = {
    appearance: "none",
    backgroundColor: "var(--surface)",
    color: "var(--fg)",
    border: "1px solid var(--border)",
    borderRadius: "999px",
    padding: "9px 34px 9px 14px",
    font: "500 14px var(--font-display)",
    backgroundImage: `url("${arrowSvg}")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    backgroundSize: "16px 16px",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <label
        htmlFor="theme-toggle"
        style={{
          fontSize: "14px",
          fontWeight: 500,
          opacity: 0.8,
          color: "var(--fg)",
        }}
      >
        {label}
      </label>
      <select
        id="theme-toggle"
        value={theme}
        onChange={(event) => handleChange(event.target.value as Theme)}
        style={selectStyle}
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
