/**
 * The parts of an error that are safe to log: its type and, for an HTTP error,
 * the status code. Never the message, response body, URL or headers, which can
 * carry patient data or tokens.
 */
export function describeError(err: unknown): {
  name?: string;
  status?: number;
} {
  const e = err as
    | { name?: unknown; response?: { status?: unknown } }
    | null
    | undefined;
  return {
    name: typeof e?.name === 'string' ? e.name : undefined,
    status:
      typeof e?.response?.status === 'number' ? e.response.status : undefined,
  };
}
