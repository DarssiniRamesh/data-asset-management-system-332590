import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastContextValue = {
  toasts: Toast[];
  // PUBLIC_INTERFACE
  pushToast: (t: Omit<Toast, "id">) => void;
  // PUBLIC_INTERFACE
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// PUBLIC_INTERFACE
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    const id = makeId();
    setToasts((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => removeToast(id), 4500);
  }, [removeToast]);

  const value = useMemo(() => ({ toasts, pushToast, removeToast }), [toasts, pushToast, removeToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

// PUBLIC_INTERFACE
export function useToasts(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToasts must be used within ToastProvider");
  return ctx;
}
