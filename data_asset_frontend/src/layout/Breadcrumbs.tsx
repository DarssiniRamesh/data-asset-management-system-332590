import { Link } from "react-router-dom";

export type Crumb = { label: string; to?: string };

type Props = {
  crumbs: Crumb[];
};

// PUBLIC_INTERFACE
export function Breadcrumbs({ crumbs }: Props) {
  /** Contract: last crumb may have no `to` to indicate current page. */
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      {crumbs.map((c, idx) => (
        <div key={`${c.label}-${idx}`} className="flex items-center gap-2">
          {c.to ? (
            <Link className="font-semibold text-brand-primary hover:underline" to={c.to}>
              {c.label}
            </Link>
          ) : (
            <span className="font-semibold text-slate-900 dark:text-slate-100">{c.label}</span>
          )}
          {idx < crumbs.length - 1 ? <span className="text-slate-400">/</span> : null}
        </div>
      ))}
    </div>
  );
}
