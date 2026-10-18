// Generic type guards for checking API responses at runtime.

// Type guard: an object whose fields can be read and checked one by one.
// Record<string, unknown> = any key may be read; each value is unknown until checked.
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// Optional URL fields come back as a string or null.
export function isStringOrNull(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}
