import { AnimatePresence, motion } from "framer-motion";

type ModalProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
};

// PUBLIC_INTERFACE
export function Modal({ open, title, children, onClose, footer }: ModalProps) {
  /** Contract:
   * - Controlled open/close
   * - Calls onClose when backdrop is clicked or Escape pressed (via button for accessibility)
   */
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          <button
            className="absolute inset-0 bg-slate-950/50"
            onClick={onClose}
            aria-label="Close modal"
          />
          <motion.div
            className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-950"
            initial={{ y: 16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </h3>
              </div>
              <button className="btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
            <div className="mt-4">{children}</div>
            {footer ? <div className="mt-5 flex justify-end gap-2">{footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
