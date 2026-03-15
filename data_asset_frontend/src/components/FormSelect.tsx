import type { ReactNode } from "react";

type FormSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type FormSelectProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FormSelectOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Optional hint displayed under the control. */
  helpText?: ReactNode;
};

// PUBLIC_INTERFACE
export function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled,
  loading,
  helpText,
}: FormSelectProps) {
  /** Contract: controlled select input with consistent validation + loading UX. */
  const isDisabled = Boolean(disabled || loading);

  return (
    <label className="block">
      <div className="label">{label}</div>
      <select
        className="input mt-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
      >
        <option value="">{loading ? "Loading…" : placeholder || "Select…"}</option>

        {!loading && options.length === 0 ? (
          <option value="" disabled>
            No options available
          </option>
        ) : null}

        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>

      {helpText ? <div className="mt-1 text-xs opacity-80">{helpText}</div> : null}
      {error ? <div className="mt-1 text-sm text-red-600">{error}</div> : null}
    </label>
  );
}
