import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaLock, FaRocket } from "react-icons/fa";
import type { Role } from "../api/types";
import { FormInput } from "../components/FormInput";
import { Icon } from "../components/Icon";
import { LoaderSpinner } from "../components/LoaderSpinner";
import { useAuth } from "../state/AuthContext";
import { useToasts } from "../state/ToastContext";
import { ApiError } from "../api/client";

// PUBLIC_INTERFACE
export function LoginPage() {
  /** Contract:
   * - Calls AuthContext.login which calls backend /api/auth/login
   * - Shows validation and backend errors
   */
  const [username, setUsername] = useState("demo");
  const [role, setRole] = useState<Role>("Viewer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const { login } = useAuth();
  const { pushToast } = useToasts();
  const nav = useNavigate();

  const validation = useMemo(() => {
    if (!username.trim()) return "Username is required.";
    return "";
  }, [username]);

  async function onSubmit(): Promise<void> {
    setError("");
    if (validation) {
      setError(validation);
      return;
    }

    setSubmitting(true);
    try {
      await login(username.trim(), role);
      pushToast({ type: "success", title: "Logged in", message: `Welcome, ${username}` });
      nav("/app");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.details.bodyText || e.message);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(String(e));
      }
      pushToast({ type: "error", title: "Login failed", message: "Please check your credentials/role." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-6 px-6 py-10 lg:grid-cols-2">
        {/* Left panel */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/50 p-8 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-950/40">
          <div className="absolute inset-0 bg-hero-gradient opacity-90" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur dark:bg-slate-950/50 dark:text-slate-200">
              <Icon icon={FaRocket} className="h-3.5 w-3.5" /> Asset Config Platform
            </div>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight">
              Secure access to your enterprise configuration workspace
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Sign in to manage assets, configure modules, validate mappings, and generate throughput setups — all backed
              by a role-based ASP.NET Core API.
            </p>

            <motion.div
              className="mt-10 grid gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="glass rounded-2xl p-4 text-sm text-slate-900/90 dark:text-white/90">
                <div className="flex items-center gap-2 font-semibold">
                  <Icon icon={FaLock} className="h-4 w-4" /> Built-in JWT
                </div>
                <div className="mt-1 text-slate-700 dark:text-white/80">
                  Authentication tokens are stored locally and applied consistently to all protected API requests.
                </div>
              </div>
              <div className="glass rounded-2xl p-4 text-sm text-slate-900/90 dark:text-white/90">
                <div className="font-semibold">Modern UX</div>
                <div className="mt-1 text-slate-700 dark:text-white/80">
                  Smooth transitions, reusable components, and a theme system with dark mode.
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right panel */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-xl font-bold">Login</h2>
          <p className="muted mt-1">Choose a role to match backend permissions.</p>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4">
            <FormInput label="Username" value={username} onChange={setUsername} placeholder="demo" error={undefined} />
            <label className="block">
              <div className="label">Role</div>
              <select className="input mt-1" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="Viewer">Viewer (read)</option>
                <option value="Editor">Editor (write)</option>
                <option value="Admin">Admin (delete)</option>
              </select>
            </label>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="btn-primary w-full"
              onClick={onSubmit}
              disabled={submitting}
            >
              {submitting ? <LoaderSpinner label="Signing in..." /> : "Sign in"}
            </motion.button>
          </div>

          <div className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            This app uses a dev login endpoint for demo purposes.
          </div>
        </div>
      </div>
    </div>
  );
}
