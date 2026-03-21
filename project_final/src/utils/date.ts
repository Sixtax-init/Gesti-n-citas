/**
 * Returns "YYYY-MM-DD" in LOCAL timezone — prevents the UTC-offset off-by-one
 * that happens when calling toISOString() on a Date with a time component.
 * Use this everywhere a date string in YYYY-MM-DD format is needed.
 */
export function localISODate(d: Date): string {
  return (
    `${d.getFullYear()}-` +
    `${String(d.getMonth() + 1).padStart(2, "0")}-` +
    `${String(d.getDate()).padStart(2, "0")}`
  );
}
