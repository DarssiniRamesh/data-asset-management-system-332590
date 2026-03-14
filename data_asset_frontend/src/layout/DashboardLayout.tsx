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
    <div className="h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex h-full">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((p) => !p)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar title="Asset Configuration Dashboard" />
          <div className="min-w-0 flex-1 overflow-auto px-6 py-6">
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
  );
}
