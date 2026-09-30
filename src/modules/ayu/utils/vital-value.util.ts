/**
 * Normalise a raw vitals form value to a number, or `null` when nothing usable
 * was recorded.
 *
 * The vitals form saves unfilled optional fields as `''`, and that survives the
 * temp-storage round trip (and may also arrive as a numeric string), so every
 * vital goes through this one function before it is displayed.
 */
export const normalizeVitalValue = (val: unknown): number | null => {
  if (val == null || val === '') return null;
  const num = typeof val === 'number' ? val : Number(val);
  return Number.isFinite(num) ? num : null;
};
