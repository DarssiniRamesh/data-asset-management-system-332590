import { AnimatePresence, motion } from "framer-motion";
import { useToasts } from "../state/ToastContext";

function bgFor(type: string): string {
  if (type === "success") return "bg-emerald-600";
  if (type === "error") return "bg-red-600";
  return "bg-slate-800";
}

// PUBLIC_INTERFACE
export function NotificationToasts() {
  /** Contract: reads ToastContext and renders transient toasts. */
  const { toasts, removeToast } = useToasts();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] w-full max-w-sm space-y-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className={`pointer-events-auto overflow-hidden rounded-2xl shadow-soft ${bgFor(t.type)}`}
          >
            <div className="flex items-start justify-between gap-3 p-4 text-white">
              <div>
                <div className="text-sm font-semibold">{t.title}</div>
                {t.message ? <div className="mt-1 text-sm text-white/90">{t.message}</div> : null}
              </div>
              <button className="text-sm font-semibold text-white/90 hover:text-white" onClick={() => removeToast(t.id)}>
                Close
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
