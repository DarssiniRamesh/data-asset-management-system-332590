import { motion } from "framer-motion";

// PUBLIC_INTERFACE
export function LoaderSpinner({ label }: { label?: string }) {
  /** Contract: purely presentational loading indicator. */
  return (
    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300" role="status">
      <motion.div
        className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-brand-primary dark:border-slate-700 dark:border-t-brand-accent"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
      />
      <span className="text-sm">{label || "Loading..."}</span>
    </div>
  );
}
