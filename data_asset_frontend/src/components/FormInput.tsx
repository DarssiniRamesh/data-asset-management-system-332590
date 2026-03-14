type FormInputProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  type?: "text" | "password";
};

// PUBLIC_INTERFACE
export function FormInput({ label, value, onChange, placeholder, error, type }: FormInputProps) {
  /** Contract: controlled input */
  return (
    <label className="block">
      <div className="label">{label}</div>
      <input
        className="input mt-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type || "text"}
      />
      {error ? <div className="mt-1 text-sm text-red-600">{error}</div> : null}
    </label>
  );
}
