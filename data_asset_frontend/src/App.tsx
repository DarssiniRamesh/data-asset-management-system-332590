import { useEffect, useMemo, useState } from "react";
import "./App.css";

type Theme = "light" | "dark";
type Role = "Admin" | "Editor" | "Viewer";

type DevLoginResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresInSeconds: number;
  username: string;
  role: string;
};

const STORAGE_KEY = "dataAsset.jwt";

// PUBLIC_INTERFACE
function App() {
  /** Minimal dev UI:
   * - lets the user request a JWT from backend /api/auth/login
   * - stores it in localStorage
   * - calls a couple of endpoints using Authorization: Bearer <token>
   */
  const [theme, setTheme] = useState<Theme>("light");

  const [backendUrl, setBackendUrl] = useState<string>(
    (process.env.REACT_APP_BACKEND_URL || "http://localhost:3001").replace(
      /\/$/,
      "",
    ),
  );

  const [username, setUsername] = useState<string>("demo");
  const [role, setRole] = useState<Role>("Viewer");
  const [token, setToken] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || "";
  });

  const [status, setStatus] = useState<string>("");
  const [lastResponse, setLastResponse] = useState<string>("");

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const nextTheme: Theme = theme === "light" ? "dark" : "light";

  // PUBLIC_INTERFACE
  const toggleTheme = (): void => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const authHeader = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  async function doFetch(path: string, init?: RequestInit): Promise<void> {
    setStatus("Loading...");
    setLastResponse("");

    try {
      /**
       * Important: RequestInit.headers is `HeadersInit` (Headers | string[][] | Record<string,string>).
       * Spreading it as an object breaks typing when it's a tuple array (it has `.length`, `.pop`, etc),
       * and it can also lose duplicate header semantics.
       *
       * Merge precedence (same as previous implementation):
       * 1) Default Content-Type
       * 2) init.headers overrides defaults
       * 3) Authorization overrides both
       */
      const headers = new Headers();
      headers.set("Content-Type", "application/json");

      if (init?.headers) {
        const initHeaders = new Headers(init.headers);
        initHeaders.forEach((value, key) => {
          headers.set(key, value);
        });
      }

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const res = await fetch(`${backendUrl}${path}`, {
        ...init,
        headers,
      });

      const text = await res.text();
      setLastResponse(text || "(empty body)");
      setStatus(`${res.status} ${res.statusText}`);
    } catch (e) {
      setStatus("Network error");
      setLastResponse(e instanceof Error ? e.message : String(e));
    }
  }

  async function login(): Promise<void> {
    setStatus("Logging in...");
    setLastResponse("");

    try {
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, role }),
      });

      const data = (await res.json()) as DevLoginResponse;

      if (!res.ok) {
        setStatus(`${res.status} ${res.statusText}`);
        setLastResponse(JSON.stringify(data, null, 2));
        return;
      }

      localStorage.setItem(STORAGE_KEY, data.accessToken);
      setToken(data.accessToken);
      setStatus(`Logged in as ${data.username} (${data.role})`);
      setLastResponse(
        JSON.stringify(
          { tokenType: data.tokenType, expiresInSeconds: data.expiresInSeconds },
          null,
          2,
        ),
      );
    } catch (e) {
      setStatus("Login error");
      setLastResponse(e instanceof Error ? e.message : String(e));
    }
  }

  function logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    setToken("");
    setStatus("Logged out");
    setLastResponse("");
  }

  return (
    <div className="App">
      <header className="App-header" style={{ padding: 24, gap: 16 }}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${nextTheme} mode`}
        >
          {theme === "light" ? "Dark" : "Light"}
        </button>

        <div style={{ maxWidth: 720, width: "100%", textAlign: "left" }}>
          <h1 style={{ margin: 0, fontSize: 28 }}>Data Asset Manager (Dev Auth)</h1>
          <p style={{ marginTop: 8, opacity: 0.85 }}>
            This UI uses a minimal dev login flow to mint a JWT and call protected endpoints.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginTop: 16,
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 14, opacity: 0.85 }}>Backend URL</span>
              <input
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
              />
            </label>

            <div />

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 14, opacity: 0.85 }}>Username</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 14, opacity: 0.85 }}>Role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="Viewer">Viewer (read)</option>
                <option value="Editor">Editor (write)</option>
                <option value="Admin">Admin (delete)</option>
              </select>
            </label>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                onClick={login}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--button-bg)",
                  color: "var(--button-text)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Login (get JWT)
              </button>
              <button
                onClick={logout}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  background: "transparent",
                  color: "var(--text-primary)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => doFetch("/healthz")}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid var(--border-color)",
                background: "transparent",
                color: "var(--text-primary)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              GET /healthz (anonymous)
            </button>

            <button
              onClick={() => doFetch("/api/assets")}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid var(--border-color)",
                background: "transparent",
                color: "var(--text-primary)",
                fontWeight: 600,
                cursor: "pointer",
              }}
              disabled={!token}
            >
              GET /api/assets (Viewer+)
            </button>

            <button
              onClick={() =>
                doFetch("/api/assets", {
                  method: "POST",
                  body: JSON.stringify({
                    siteId: "S1",
                    assetGroup: "AG",
                    processGroup: "PG",
                    assetName: `Demo Asset ${Date.now()}`,
                    permitEuId: "P1",
                    globalUniqueAssetId: `GUA-${Date.now()}`,
                    createdBy: "frontend",
                    correlationId: `corr-${Date.now()}`,
                  }),
                })
              }
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid var(--border-color)",
                background: "transparent",
                color: "var(--text-primary)",
                fontWeight: 600,
                cursor: "pointer",
              }}
              disabled={!token}
            >
              POST /api/assets (Editor+)
            </button>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 14, opacity: 0.85 }}>Status</div>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-color)",
                borderRadius: 10,
                padding: 12,
                marginTop: 6,
              }}
            >
              {status || "(no requests yet)"}
            </pre>

            <div style={{ fontSize: 14, opacity: 0.85 }}>Response</div>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-color)",
                borderRadius: 10,
                padding: 12,
                marginTop: 6,
                maxHeight: 280,
                overflow: "auto",
              }}
            >
              {lastResponse || "(none)"}
            </pre>

            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 10 }}>
              Token stored in localStorage key: <code>{STORAGE_KEY}</code>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
