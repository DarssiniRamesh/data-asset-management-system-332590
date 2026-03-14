import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaBolt, FaCogs, FaDatabase, FaLock } from "react-icons/fa";
import { Icon } from "../components/Icon";

const features = [
  {
    title: "Role-based Access",
    desc: "JWT-secured endpoints with Viewer/Editor/Admin permissions.",
    icon: FaLock,
  },
  { title: "Asset CRUD", desc: "Create, browse, update, and delete assets with validation.", icon: FaDatabase },
  { title: "Module Tabs", desc: "Manage Site Assets, Input EF mappings, and Throughput setup.", icon: FaCogs },
  { title: "Fast Workflows", desc: "Smooth, modern UI with animations and reusable components.", icon: FaBolt },
];

const highlights = [
  { label: "Built for teams", value: "RBAC + JWT" },
  { label: "Fast iteration", value: "Typed API client" },
  { label: "Confident changes", value: "Validation-first" },
];

// PUBLIC_INTERFACE
export function LandingPage() {
  /** Contract: public marketing entry to the dashboard. */
  const reduceMotion = useReducedMotion();

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
            className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.15fr_0.85fr]"
          >
            {/* Hero copy */}
            <motion.div variants={item} className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/65 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/45 dark:text-slate-200">
                Production-ready React + TypeScript UI
              </div>

              <h1 className="mt-5 text-4xl font-extrabold leading-[1.06] tracking-tight md:text-6xl">
                <span className="text-gradient">Asset Configuration</span>
                <span className="block text-slate-900 dark:text-slate-100">Platform</span>
              </h1>

              <p className="mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-300 md:text-[1.05rem]">
                A premium enterprise dashboard for managing assets and configuration modules, fully integrated with an
                ASP.NET Core backend API—designed for clarity, speed, and safe change.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/app" className="btn-primary-premium">
                  Open Dashboard
                </Link>
                <Link to="/login" className="btn-secondary-premium">
                  Login
                </Link>

                <div className="ml-0 mt-2 w-full text-xs text-slate-500 dark:text-slate-400 sm:ml-2 sm:mt-0 sm:w-auto">
                  Tip: Try <span className="font-semibold text-slate-700 dark:text-slate-200">Viewer</span> role for read
                  access.
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

            {/* Hero card / preview */}
            <motion.div variants={item} className="relative">
              <div className="absolute -inset-1 rounded-[1.75rem] bg-gradient-to-br from-brand-primary/25 via-indigo-500/10 to-brand-accent/20 blur-xl opacity-70" />
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-950/45">
                <div className="absolute inset-0 bg-hero-gradient opacity-35" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold tracking-tight">Workspace</div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        Assets • Validation • Throughput Setup
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur dark:bg-slate-950/50 dark:text-slate-200 dark:ring-slate-800">
                      Secure JWT
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm transition will-change-transform hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/40">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Asset</div>
                          <div className="mt-1 text-sm font-bold tracking-tight">Boiler Stack #12</div>
                        </div>
                        <div className="h-9 w-9 rounded-xl bg-brand-primary/10 ring-1 ring-brand-primary/20">
                          <div className="grid h-full w-full place-items-center">
                            <span className="block h-2 w-2 rounded-full bg-brand-primary shadow-[0_0_0_4px_rgba(37,99,235,0.12)]" />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-brand-primary/10 px-2.5 py-1 text-[11px] font-semibold text-brand-primary ring-1 ring-brand-primary/20">
                          Input EF Mapping
                        </span>
                        <span className="rounded-full bg-brand-accent/10 px-2.5 py-1 text-[11px] font-semibold text-brand-accent ring-1 ring-brand-accent/20">
                          Throughput Setup
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm transition will-change-transform hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/40">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Validation</div>
                          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            Consistent error handling and UI feedback.
                          </div>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-accent/80" />
                      Subtle motion, accessible focus, premium defaults.
                    </div>
                    <div className="hidden sm:block">React • Tailwind • Framer Motion</div>
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

          {/* Architecture block */}
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
                  <h2 className="text-xl font-bold tracking-tight">Architecture & Workflow</h2>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    API client • JWT auth • consistent errors
                  </div>
                </div>

                <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
                  The platform is organized around assets and their configuration modules. Each asset can be viewed in a
                  details page with dedicated tabs for Site Assets, Input EF mapping, and Throughput Setup. The frontend
                  uses a single API client flow with consistent error handling and JWT authentication.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/35">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">Single API client</div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      Centralized error handling and typed endpoints.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/35">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">Protected routes</div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      Dashboard pages are guarded by JWT auth.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/35">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">Premium UX defaults</div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      Subtle gradients, refined type, and motion that respects settings.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <div className="mt-16 border-t border-slate-200 pt-8 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            © {new Date().getFullYear()} Asset Configuration Platform — Built with React, TailwindCSS, and Framer Motion.
          </div>
        </div>
      </div>
    </div>
  );
}
