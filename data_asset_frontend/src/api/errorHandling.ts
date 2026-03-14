import { ApiError } from "./client";

type FieldErrors = Record<string, string>;

/**
 * HttpValidationProblemDetails shape used by ASP.NET Core.
 * See OpenAPI schema: HttpValidationProblemDetails { errors: { [field]: string[] } }
 */
type HttpValidationProblemDetails = {
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  errors?: Record<string, string[] | undefined> | null;
};

/**
 * ProblemDetails shape (also used for 409 Conflict responses).
 */
type ProblemDetails = {
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  type?: string | null;
};

/**
 * Result of parsing an ApiError into information that can be cleanly surfaced by the UI.
 */
export type ParsedApiError = {
  /** A short, user-facing summary (appropriate for a toast title or inline banner). */
  title: string;
  /** Optional longer user-facing message. */
  message?: string;
  /**
   * Optional field-level errors, keyed by the backend field name.
   * Intended to map to form inputs (e.g., permitEuId, parentPseudoAssetId).
   */
  fieldErrors?: FieldErrors;
  /**
   * Optional guidance for remediation (e.g., “change permitEuId/globalUniqueAssetId”).
   * This is user-facing text; keep it actionable and concrete.
   */
  remediation?: string;
};

function safeJsonParse(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeFieldErrors(errors: HttpValidationProblemDetails["errors"]): FieldErrors {
  const out: FieldErrors = {};
  if (!errors) return out;

  for (const [field, msgs] of Object.entries(errors)) {
    if (!msgs || msgs.length === 0) continue;
    out[field] = msgs.join(" ");
  }
  return out;
}

/**
 * PUBLIC_INTERFACE
 * Parse an ApiError into a structured, user-friendly shape for consistent UI handling.
 *
 * Contract:
 * Inputs:
 *  - err: unknown (typically caught error)
 * Outputs:
 *  - ParsedApiError | null (null means “not an ApiError we can parse”)
 * Errors:
 *  - Never throws (safe to call in catch blocks)
 * Side effects:
 *  - None
 */
export function parseApiError(err: unknown): ParsedApiError | null {
  if (!(err instanceof ApiError)) return null;

  const status = err.details.status;
  const bodyText = err.details.bodyText || "";

  const parsed = safeJsonParse(bodyText);

  // 400 - validation errors
  if (status === 400 && parsed && typeof parsed === "object") {
    const v = parsed as HttpValidationProblemDetails;
    const fieldErrors = normalizeFieldErrors(v.errors);

    const title = v.title || "Validation failed";
    const message =
      v.detail ||
      (Object.keys(fieldErrors).length > 0
        ? "Please correct the highlighted fields and try again."
        : bodyText || `HTTP ${status}`);

    return {
      title,
      message,
      fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
    };
  }

  // 409 - conflict / duplicates
  if (status === 409) {
    const p =
      parsed && typeof parsed === "object" ? (parsed as ProblemDetails) : ({} as ProblemDetails);

    const title = p.title || "Duplicate / conflict";
    const message = p.detail || bodyText || `HTTP ${status}`;

    // Provide explicit guidance for the known duplicate IDs scenario.
    const remediation =
      "This usually means Permit EU ID and/or Global Unique Asset ID already exists. " +
      "Change permitEuId and/or globalUniqueAssetId to a new unique value, then submit again.";

    return { title, message, remediation };
  }

  // fallback (still make it readable)
  return {
    title: "Request failed",
    message: bodyText || `HTTP ${status}`,
  };
}

/**
 * PUBLIC_INTERFACE
 * Merge new field errors into existing ones, preferring newer values.
 *
 * Contract:
 * Inputs:
 *  - prev: existing errors
 *  - next: new errors
 * Outputs:
 *  - merged errors
 * Side effects:
 *  - None
 */
export function mergeFieldErrors(prev: FieldErrors, next: FieldErrors): FieldErrors {
  return { ...prev, ...next };
}
