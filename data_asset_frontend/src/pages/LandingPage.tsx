import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBolt, FaCogs, FaDatabase, FaLock } from "react-icons/fa";
import type { Role } from "../api/types";
import { ApiError } from "../api/client";
import { FormInput } from "../components/FormInput";
import { Icon } from "../components/Icon";
import { LoaderSpinner } from "../components/LoaderSpinner";
import { useAuth } from "../state/AuthContext";
import { useToasts } from "../state/ToastContext";

const features = [
  {
    title: "Access control by role",
    desc: "Give teams the right level of access for viewing, editing, and administration.",
    icon: FaLock,
  },
  {
    title: "Centralized asset catalog",
    desc: "Create, find, and maintain asset records with consistent validation and audit fields.",
    icon: FaDatabase,
  },
  {
    title: "Configuration modules",
    desc: "Manage mappings and setup workflows through structured, task-focused tabs.",
    icon: FaCogs,
  },
  {
    title: "Efficient day-to-day work",
    desc: "Streamlined screens designed for speed, clarity, and fewer errors.",
    icon: FaBolt,
  },
];

const highlights = [
  { label: "Designed for operations", value: "Clear workflows" },
  { label: "Governed changes", value: "Role-based access" },
  { label: "Traceable work", value: "Audit-ready fields" },
];

// PUBLIC_INTERFACE
export function LandingPage() {
  /** Contract:
   * - Public entry page for the product
   * - Includes embedded sign-in (no separate /login page)
   */
  const reduceMotion = useReducedMotion();
  const { login, isAuthenticated } = useAuth();
  const { pushToast } = useToasts();
  const nav = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("demo");
  const [role, setRole] = useState<Role>("Viewer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const fromPath = (location.state as { from?: string } | null)?.from ?? "/app";

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
      pushToast({ type: "success", title: "Signed in", message: `Welcome, ${username}` });
      nav(fromPath);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.details.bodyText || e.message);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(String(e));
      }
      pushToast({ type: "error", title: "Sign-in failed", message: "Please check your credentials/role." });
    } finally {
      setSubmitting(false);
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: reduceMotion
        ? { duration: 0.01 }
        : {
            staggerChildren: 0.08,
            delayChildren: 0.06,
          },
    },
  };

  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
    show: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0.01 : 0.55, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="relative overflow-hidden">
        {/* Background: gradient + animated blobs */}
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-primary/20 blur-3xl animate-float-slow" />
        <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-brand-accent/20 blur-3xl animate-float" />
        <div className="pointer-events-none absolute left-1/2 top-[28rem] h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-400/10 blur-3xl animate-float-slower" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/70 to-transparent dark:via-slate-800/70" />

        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-24">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.05fr_0.95fr]"
          >
            {/* Hero copy */}
            <motion.div variants={item} className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/65 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/45 dark:text-slate-200">
                Asset management and configuration workspace
              </div>

              <h1 className="mt-5 text-4xl font-extrabold leading-[1.06] tracking-tight md:text-6xl">
                <span className="text-gradient">Asset Configuration</span>
                <span className="block text-slate-900 dark:text-slate-100">Platform</span>
              </h1>

              <p className="mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-300 md:text-[1.05rem]">
                Manage assets, configuration modules, and controlled updates in one place. Built for teams that need
                consistency, clear permissions, and reliable day-to-day workflows.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/app" className="btn-primary-premium">
                  Open the workspace
                </Link>

                <div className="ml-0 mt-2 w-full text-xs text-slate-500 dark:text-slate-400 sm:ml-2 sm:mt-0 sm:w-auto">
                  Sign in on the right to continue.
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {highlights.map((h) => (
                  <div
                    key={h.label}
                    className="rounded-2xl border border-slate-200 bg-white/55 px-4 py-3 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-950/35"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      {h.label}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{h.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Embedded sign-in */}
            <motion.div variants={item} className="relative">
              <div className="absolute -inset-1 rounded-[1.75rem] bg-gradient-to-br from-brand-primary/25 via-indigo-500/10 to-brand-accent/20 blur-xl opacity-70" />
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-950/45">
                <div className="absolute inset-0 bg-hero-gradient opacity-35" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold tracking-tight">Sign in</div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        Use your role to access the workspace features.
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur dark:bg-slate-950/50 dark:text-slate-200 dark:ring-slate-800">
                      Secure session
                    </div>
                  </div>

                  {isAuthenticated ? (
                    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
                      You’re already signed in. You can open the workspace to continue.
                    </div>
                  ) : null}

                  {error ? (
                    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                      {error}
                    </div>
                  ) : null}

                  <div className="mt-6 grid gap-4">
                    <FormInput
                      label="Username"
                      value={username}
                      onChange={setUsername}
                      placeholder="Your username"
                      error={undefined}
                    />
                    <label className="block">
                      <div className="label">Role</div>
                      <select className="input mt-1" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                        <option value="Viewer">Viewer</option>
                        <option value="Editor">Editor</option>
                        <option value="Admin">Admin</option>
                      </select>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Permissions are enforced consistently across the workspace.
                      </div>
                    </label>

                    <motion.button
                      whileHover={reduceMotion ? undefined : { scale: 1.01 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                      className="btn-primary w-full"
                      onClick={onSubmit}
                      disabled={submitting || isAuthenticated}
                    >
                      {submitting ? <LoaderSpinner label="Signing in..." /> : "Sign in"}
                    </motion.button>

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      After signing in, you’ll be taken to the workspace automatically.
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-accent/80" />
                      Role-based access and consistent validation.
                    </div>
                    <div className="hidden sm:block">Operational, governed workflows</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Feature grid */}
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={item}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                transition={{ duration: 0.18 }}
                className="group relative rounded-2xl border border-slate-200 bg-white/75 p-5 shadow-soft backdrop-blur transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950/45"
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-hero-gradient" />
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-gradient-to-br from-brand-primary/15 to-brand-accent/10 p-3 ring-1 ring-slate-200/60 transition group-hover:from-brand-primary/20 group-hover:to-brand-accent/15 dark:ring-slate-800/70">
                      <Icon icon={f.icon} className="h-5 w-5 text-brand-primary" />
                    </div>
                    <div className="text-sm font-semibold tracking-tight">{f.title}</div>
                  </div>
                  <div className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{f.desc}</div>

                  <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-slate-200/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:via-slate-800/80" />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Overview block (rename from architecture/dev-centric language) */}
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-14"
          >
            <motion.div
              variants={item}
              className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/75 p-8 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-950/45"
            >
              <div className="absolute inset-0 opacity-60 bg-[radial-gradient(900px_300px_at_0%_0%,rgba(37,99,235,0.10),transparent_60%),radial-gradient(900px_300px_at_100%_0%,rgba(245,158,11,0.08),transparent_55%)]" />
              <div className="relative">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                  <h2 className="text-xl font-bold tracking-tight">How it’s organized</h2>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Assets • modules • controlled updates</div>
                </div>

                <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
                  The workspace is centered on assets and the configuration modules attached to them. Each asset has a
                  dedicated details view with structured tabs so teams can make updates in a consistent, repeatable way.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/35">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">Standardized screens</div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      A consistent layout for create, edit, review, and audit.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/35">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">Permissions you can trust</div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      Role-based access applied across routes and API requests.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/35">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">Fewer avoidable errors</div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      Validation and clear feedback to support safe changes.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <div className="mt-16 border-t border-slate-200 pt-8 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            © {new Date().getFullYear()} Asset Configuration Platform
          </div>
        </div>
      </div>
    </div>
  );
}
