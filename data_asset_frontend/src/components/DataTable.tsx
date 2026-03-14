import { motion } from "framer-motion";

export type Column<T> = {
  key: string;
  header: string;
  // PUBLIC_INTERFACE
  render: (row: T) => React.ReactNode;
  widthClassName?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyLabel?: string;
};

// PUBLIC_INTERFACE
export function DataTable<T>({ columns, rows, rowKey, emptyLabel }: DataTableProps<T>) {
  /** Contract:
   * - Pure component; caller controls sorting/pagination/filtering.
   */
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-950">
      <table className="w-full table-auto">
        <thead className="bg-slate-50 text-left dark:bg-slate-900/60">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 ${c.widthClassName || ""}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400" colSpan={columns.length}>
                {emptyLabel || "No rows."}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <motion.tr
                key={rowKey(r)}
                whileHover={{ backgroundColor: "rgba(37, 99, 235, 0.06)" }}
                transition={{ duration: 0.15 }}
                className="border-t border-slate-100 dark:border-slate-900"
              >
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-sm text-slate-800 dark:text-slate-200">
                    {c.render(r)}
                  </td>
                ))}
              </motion.tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
