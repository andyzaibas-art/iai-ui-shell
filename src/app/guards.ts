export function enableBeforeUnloadGuard(shouldBlock: () => boolean) {
  const handler = (e: BeforeUnloadEvent) => {
    if (!shouldBlock()) return;
    e.preventDefault();
    e.returnValue = "";
  };

  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}
