import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaChartBar, FaHeartbeat, FaShieldAlt, FaTable } from "react-icons/fa";
import { getAppConfig } from "../config";
import { apiRequest } from "../api/client";
import { Icon } from "../components/Icon";
import { LoaderSpinner } from "../components/LoaderSpinner";
import { useToasts } from "../state/ToastContext";

type Health = unknown;

// PUBLIC_INTERFACE
export function DashboardHomePage() {
  /** Contract: simple overview + health check. */
  const cfg = getAppConfig();
  const { pushToast } = useToasts();
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load(): Promise<void> {
      setLoading(true);
      try {
        const data = await apiRequest<Health>({ method: "GET", path: cfg.healthPath });
        if (mounted) setHealth(data);
      } catch (e) {
        pushToast({ type: "error", title: "Health check failed", message: "Backend may be unavailable." });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [cfg.healthPath, pushToast]);

  const cards = [
    { title: "Assets", desc: "Browse and manage asset catalog.", icon: FaTable },
    { title: "Modules", desc: "Manage mappings and throughput workflows.", icon: FaChartBar },
    { title: "Security", desc: "Role-based API access with JWT.", icon: FaShieldAlt },
    { title: "Health", desc: "Backend status monitoring.", icon: FaHeartbeat },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Overview</h1>
        <p className="muted mt-1">Your operational dashboard for asset configuration.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <motion.div
            key={c.title}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.15 }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-brand-primary/10 p-3 ring-1 ring-brand-primary/20">
                <Icon icon={c.icon} className="h-5 w-5 text-brand-primary" />
              </div>
              <div className="text-sm font-semibold">{c.title}</div>
            </div>
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">{c.desc}</div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <div className="text-sm font-semibold">Backend Health</div>
        <div className="muted mt-1">GET {cfg.healthPath}</div>
        <div className="mt-4">
          {loading ? (
            <LoaderSpinner />
          ) : (
            <pre className="max-h-60 overflow-auto rounded-xl bg-slate-50 p-4 text-xs text-slate-800 dark:bg-slate-900/60 dark:text-slate-100">
              {health ? JSON.stringify(health, null, 2) : "(no data)"}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
