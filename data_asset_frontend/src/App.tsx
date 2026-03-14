import { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";

type Theme = "light" | "dark";

// PUBLIC_INTERFACE
function App() {
  /**
   * Contract:
   * - theme is always one of: "light" | "dark"
   * - Side effect: writes the chosen theme to `document.documentElement[data-theme]`
   */
  const [theme, setTheme] = useState<Theme>("light");

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = (): void => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const nextTheme: Theme = theme === "light" ? "dark" : "light";

  return (
    <div className="App">
      <header className="App-header">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${nextTheme} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <p>
          Current theme: <strong>{theme}</strong>
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
