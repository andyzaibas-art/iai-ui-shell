export function uid(prefix = 'id') {
  // Good enough for local-only demos.
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}
