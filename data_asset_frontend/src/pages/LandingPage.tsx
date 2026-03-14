import { motion } from "framer-motion";
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

// PUBLIC_INTERFACE
export function LandingPage() {
  /** Contract: public marketing entry to the dashboard. */
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="relative mx-auto max-w-6xl px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
              Production-ready React + TypeScript UI
            </div>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight">
              Asset Configuration Platform
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
              A modern enterprise dashboard for managing assets and configuration modules, fully integrated with an
              ASP.NET Core backend API.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/app" className="btn-primary">
                Open Dashboard
              </Link>
              <Link to="/login" className="btn-secondary">
                Login
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.15 }}
                className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-brand-primary/10 p-3 ring-1 ring-brand-primary/20">
                    <Icon icon={f.icon} className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div className="text-sm font-semibold">{f.title}</div>
                </div>
                <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">{f.desc}</div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mt-14 rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-950/40"
          >
            <h2 className="text-xl font-bold">Architecture & Workflow</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              The platform is organized around assets and their configuration modules. Each asset can be viewed in a
              details page with dedicated tabs for Site Assets, Input EF mapping, and Throughput Setup. The frontend uses
              a single API client flow with consistent error handling and JWT authentication.
            </p>
          </motion.div>

          <div className="mt-16 border-t border-slate-200 pt-8 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            © {new Date().getFullYear()} Asset Configuration Platform — Built with React, TailwindCSS, Framer Motion, and
            Font Awesome icons.
          </div>
        </div>
      </div>
    </div>
  );
}
