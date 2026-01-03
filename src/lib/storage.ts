export type WriteDraft = {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO
};

const KEY = 'iai:writes:v1';

export function loadWrites(): WriteDraft[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isWriteDraft);
  } catch {
    return [];
  }
}

export function saveWrites(items: WriteDraft[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addWriteDraft(draft: WriteDraft) {
  const all = loadWrites();
  all.unshift(draft);
  saveWrites(all);
}

export function removeWriteDraft(id: string) {
  const all = loadWrites().filter((w) => w.id !== id);
  saveWrites(all);
}

export function clearWrites() {
  localStorage.removeItem(KEY);
}

function isWriteDraft(v: any): v is WriteDraft {
  return (
    v &&
    typeof v === 'object' &&
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.content === 'string' &&
    typeof v.createdAt === 'string'
  );
}
