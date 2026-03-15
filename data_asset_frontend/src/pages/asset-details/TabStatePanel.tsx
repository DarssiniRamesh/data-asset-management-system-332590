import { ApiError } from "../../api/client";
import { parseApiError } from "../../api/errorHandling";
import { LoaderSpinner } from "../../components/LoaderSpinner";

type TabStatePanelProps = {
  title: string;
  description?: string;
  loading: boolean;
  error: unknown;
  isEmpty: boolean;
  emptyTitle: string;
  emptyMessage?: string;
  /**
   * Optional call-to-action(s) displayed in the empty state.
   * Contract:
   *  - Only rendered when isEmpty === true and there is no loading/error.
   *  - Use for BRD-aligned “what do I do next?” guidance on post-create flows.
   */
  emptyActions?: React.ReactNode;
  children: React.ReactNode;
};

// PUBLIC_INTERFACE
export function TabStatePanel(props: TabStatePanelProps) {
  /** Contract:
   * Purpose:
   *  - Provide consistent loading/error/empty-state UX for Asset Details tabs.
   * Inputs:
   *  - loading/error/isEmpty + title/empty copy
   * Behavior:
   *  - loading => spinner
   *  - error => red banner with best-effort error detail
   *  - empty => neutral empty-state banner
   *  - else => render children
   */
  const parsed = props.error ? parseApiError(props.error) : null;

  const fallbackMessage =
    props.error instanceof ApiError
      ? props.error.details.bodyText || `HTTP ${props.error.details.status}`
      : props.error instanceof Error
        ? props.error.message
        : props.error
          ? String(props.error)
          : "";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{props.title}</div>
          {props.description ? (
            <div className="muted mt-1">{props.description}</div>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        {props.loading ? (
          <LoaderSpinner label={`Loading ${props.title.toLowerCase()}...`} />
        ) : props.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
            <div className="font-semibold">
              {parsed?.title || "Failed to load"}
            </div>
            <div className="mt-1 opacity-90">
              {parsed?.message || fallbackMessage || "An unexpected error occurred."}
            </div>
            {parsed?.remediation ? (
              <div className="mt-2 text-xs opacity-90">
                <span className="font-semibold">How to fix:</span> {parsed.remediation}
              </div>
            ) : null}
          </div>
        ) : props.isEmpty ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
            <div className="font-semibold">{props.emptyTitle}</div>
            {props.emptyMessage ? (
              <div className="mt-1 opacity-90">{props.emptyMessage}</div>
            ) : null}

            {props.emptyActions ? <div className="mt-3">{props.emptyActions}</div> : null}
          </div>
        ) : (
          props.children
        )}
      </div>
    </div>
  );
}
