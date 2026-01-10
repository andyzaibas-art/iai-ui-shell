import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Clock } from "lucide-react";
import EmptyState from "../components/EmptyState";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

interface SavedEntry {
  id: string;
  title: string;
  body: string;
  tags: string;
  type: string;
  timestamp: string;
}

const STORAGE_KEY = "iai_saved_entries";

export default function HistoryPage() {
  const [entries, setEntries] = useState<SavedEntry[]>([]);

  const load = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setEntries([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setEntries(Array.isArray(parsed) ? parsed : []);
    } catch {
      setEntries([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const del = (id: string) => {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    toast.success("Entry deleted");
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
            <CardDescription>Saved entries (local-only).</CardDescription>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No saved entries yet"
                description="Go to Write page and save your first entry."
              />
            ) : (
              <div className="space-y-4">
                {entries.map((e) => (
                  <div
                    key={e.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-900/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-semibold text-neutral-100 truncate">
                            {e.title}
                          </div>
                          <Badge>{e.type}</Badge>
                        </div>

                        <div className="text-sm text-neutral-300 whitespace-pre-wrap line-clamp-3">
                          {e.body}
                        </div>

                        {e.tags ? (
                          <div className="flex flex-wrap gap-2">
                            {e.tags.split(",").map((t, idx) => (
                              <Badge key={idx} className="text-neutral-300">
                                {t.trim()}
                              </Badge>
                            ))}
                          </div>
                        ) : null}

                        <div className="text-xs text-neutral-500">
                          {new Date(e.timestamp).toLocaleString()}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => del(e.id)}
                        className="text-neutral-300 hover:text-red-300"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
