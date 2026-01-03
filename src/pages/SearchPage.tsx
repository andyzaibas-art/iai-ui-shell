import { useMemo, useState } from "react";

const demoDocs = [
  { title: 'How to create travel commands', snippet: 'Define quick actions like “Find flights” and ask clarifying questions…' },
  { title: 'Rules template', snippet: 'Keep instructions deterministic: only do what the command says…' },
  { title: 'Local storage note', snippet: 'This UI shell stores data locally only.' }
];

export default function SearchPage() {
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return demoDocs;
    return demoDocs.filter(
      (d) => d.title.toLowerCase().includes(s) || d.snippet.toLowerCase().includes(s)
    );
  }, [q]);

  return (
    <div className="page">
      <div className="card">
        <div className="cardHeader">
          <h2>Search</h2>
          <p className="muted">Demo search (local, static data).</p>
        </div>

        <div className="row">
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            aria-label="Search"
          />
          <button className="btn" type="button" onClick={() => setQ('')}>
            Clear
          </button>
        </div>

        <div className="list" style={{ marginTop: 14 }}>
          {results.map((r) => (
            <div key={r.title} className="listItem">
              <div className="listTitle">{r.title}</div>
              <div className="muted">{r.snippet}</div>
            </div>
          ))}
          {results.length === 0 && <div className="muted">No results.</div>}
        </div>
      </div>
    </div>
  );
}
