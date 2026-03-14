import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

// PUBLIC_INTERFACE
export function DashboardLayout() {
  /** Contract:
   * - Renders the authenticated app shell.
   * - Uses Outlet for nested routes.
   * Observability: route changes are animated for perceived performance.
   */
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="relative h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Premium backdrop (subtle, shared visual language with LandingPage) */}
      <div className="pointer-events-none absolute inset-0 bg-hero-gradient opacity-60 dark:opacity-40" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/70 to-transparent dark:via-slate-800/70" />

      <div className="relative flex h-full">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((p) => !p)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar title="Asset Configuration Dashboard" />

          <div className="min-w-0 flex-1 overflow-auto px-4 py-5 sm:px-6 sm:py-6">
            {/* Content surface: keeps pages readable on top of gradient backdrop */}
            <div className="min-h-full rounded-3xl border border-slate-200/70 bg-white/70 p-4 shadow-soft backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/45 sm:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
