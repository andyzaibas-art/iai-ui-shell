import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";

interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  type: string;
  date: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setHasSearched(true);
    setResults([
      {
        id: "1",
        title: "Sample Document 1",
        excerpt:
          "Placeholder search result. Real search will be added later.",
        type: "Article",
        date: new Date().toLocaleDateString(),
      },
      {
        id: "2",
        title: "Sample Document 2",
        excerpt: "Another placeholder result for UI demo.",
        type: "Note",
        date: new Date().toLocaleDateString(),
      },
    ]);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Search</CardTitle>
            <CardDescription>Dummy results for now.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex gap-2"
            >
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter search query..."
              />
              <Button type="submit" className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {hasSearched && results.length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm text-neutral-400">
              {results.length} results
            </div>
            {results.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <CardTitle className="text-base">{r.title}</CardTitle>
                  <CardDescription>{r.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-neutral-500">
                    {r.type} · {r.date}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
