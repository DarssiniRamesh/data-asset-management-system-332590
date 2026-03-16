import clsx from "clsx";

export type TabSpec = { id: string; label: string };

type TabsProps = {
  tabs: TabSpec[];
  activeId: string;
  // PUBLIC_INTERFACE
  onChange: (id: string) => void;
};

/**
 * Tabs rendering contract:
 * - Renders a WAI-ARIA compliant tablist with role=tab buttons.
 * - Each tab has stable test hooks via data-testid.
 * - Callers should render corresponding panels and (optionally) use aria-controls/id pairing.
 */

// PUBLIC_INTERFACE
export function Tabs({ tabs, activeId, onChange }: TabsProps) {
  /** Contract: controlled tabs */
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Asset details tabs" data-testid="asset-tabs">
      {tabs.map((t) => {
        const selected = activeId === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            data-testid={`tab-${t.id}`}
            onClick={() => onChange(t.id)}
            className={clsx(
              "rounded-xl px-3 py-2 text-sm font-semibold transition",
              selected
                ? "bg-brand-primary text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
