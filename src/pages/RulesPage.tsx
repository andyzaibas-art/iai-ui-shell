import { useMemo, useState } from "react";

const defaultRules = `# Rules (local draft)

- This is a UI shell only.
- No Internet Identity wiring.
- No canister calls.
- Local-only demo saves (browser storage).

## Example: “Find tickets” command
Ask clarifying questions:
- dates?
- departure city?
- with hotel?
- budget?
`;

export default function RulesPage() {
  const [text, setText] = useState(defaultRules);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const last = useMemo(() => {
    const raw = localStorage.getItem('iai:rules:v1');
    return raw || null;
  }, [savedAt]);

  return (
    <div className="page">
      <div className="card">
        <div className="cardHeader">
          <h2>Rules</h2>
          <p className="muted">Local draft editor (no backend).</p>
        </div>

        <textarea
          className="textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
        />

        <div className="row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
          <div className="muted">
            {last ? 'Saved locally.' : 'Not saved yet.'} {savedAt ? `(${savedAt})` : ''}
          </div>
          <button
            className="btn btnPrimary"
            type="button"
            onClick={() => {
              localStorage.setItem('iai:rules:v1', text);
              setSavedAt(new Date().toLocaleString());
            }}
          >
            Save local
          </button>
        </div>
      </div>
    </div>
  );
}
