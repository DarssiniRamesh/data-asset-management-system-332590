import { mergeFieldErrors, parseApiError } from "../../../api/errorHandling";

export type FieldErrors = Record<string, string>;

/**
 * PUBLIC_INTERFACE
 * Map a backend ParsedApiError (HttpValidationProblemDetails / ProblemDetails) to UI field errors + banner text.
 */
export function extractErrors(err: unknown): {
  title: string;
  message?: string;
  remediation?: string;
  fieldErrors: FieldErrors;
} {
  const parsed = parseApiError(err);
  if (!parsed) {
    return {
      title: "Request failed",
      message: err instanceof Error ? err.message : String(err),
      fieldErrors: {},
    };
  }

  return {
    title: parsed.title,
    message: parsed.message,
    remediation: parsed.remediation,
    fieldErrors: parsed.fieldErrors ?? {},
  };
}

/**
 * PUBLIC_INTERFACE
 * Merge field errors (prefer latest).
 */
export function mergeErrors(prev: FieldErrors, next: FieldErrors): FieldErrors {
  return mergeFieldErrors(prev, next);
}

/**
 * PUBLIC_INTERFACE
 * Validate required string fields (trim-aware).
 */
export function validateRequiredStrings(values: Record<string, string>): FieldErrors {
  const errors: FieldErrors = {};
  for (const [k, v] of Object.entries(values)) {
    if (!v || !v.trim()) errors[k] = "Required";
  }
  return errors;
}

/**
 * PUBLIC_INTERFACE
 * Parse an integer field from a string input; returns null when empty.
 */
export function parseOptionalInt(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * PUBLIC_INTERFACE
 * Ensure a required integer is present and valid.
 */
export function requireInt(v: string, fieldName: string): { value: number | null; error?: string } {
  const parsed = parseOptionalInt(v);
  if (parsed === null) return { value: null, error: `${fieldName} is required` };
  return { value: parsed };
}
