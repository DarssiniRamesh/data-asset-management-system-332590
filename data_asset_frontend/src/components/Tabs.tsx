import clsx from "clsx";

export type TabSpec = { id: string; label: string };

type TabsProps = {
  tabs: TabSpec[];
  activeId: string;
  // PUBLIC_INTERFACE
  onChange: (id: string) => void;
};

// PUBLIC_INTERFACE
export function Tabs({ tabs, activeId, onChange }: TabsProps) {
  /** Contract: controlled tabs */
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={clsx(
            "rounded-xl px-3 py-2 text-sm font-semibold transition",
            activeId === t.id
              ? "bg-brand-primary text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
