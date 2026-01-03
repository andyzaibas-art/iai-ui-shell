import { useMemo, useState } from "react";
import Modal from '../components/Modal';
import { clearWrites, loadWrites, removeWrite, type WriteDraft } from '../lib/storage';
import { formatWhen } from '../lib/time';

export default function HistoryPage() {
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState<WriteDraft | null>(null);

  const items = useMemo(() => {
    return loadWrites();
  }, [refresh]);

  const hasAny = items.length > 0;

  return (
    <div className="page">
      <div className="card">
        <div className="cardHeader">
          <h2>History</h2>
          <p className="muted">Saved items from the Write page (local only).</p>
        </div>

        <div className="row" style={{ justifyContent: 'space-between', gap: 10 }}>
          <div className="muted">
            {hasAny ? `${items.length} item(s)` : 'No saved items yet.'}
          </div>
          <button
            className="btn"
            type="button"
            disabled={!hasAny}
            onClick={() => {
              clearWrites();
              setSelected(null);
              setRefresh((x) => x + 1);
            }}
          >
            Clear all
          </button>
        </div>

        <div className="list" style={{ marginTop: 14 }}>
          {items.map((w) => (
            <div key={w.id} className="listItem listItemClickable" role="button" tabIndex={0}
              onClick={() => setSelected(w)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelected(w);
              }}
            >
              <div className="listTitle">{w.title || 'Untitled'}</div>
              <div className="muted">{formatWhen(w.createdAt)}</div>
              <div className="listActions">
                <button
                  className="btn btnDanger"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWrite(w.id);
                    if (selected?.id === w.id) setSelected(null);
                    setRefresh((x) => x + 1);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {!hasAny && (
            <div className="muted" style={{ padding: 10 }}>
              Tip: open <strong>Write</strong>, enter text, hit <strong>Save</strong>, then consent.
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!selected}
        title={selected?.title || 'Untitled'}
        onClose={() => setSelected(null)}
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn" type="button" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
        }
      >
        <div className="muted" style={{ marginBottom: 10 }}>
          {selected ? formatWhen(selected.createdAt) : ''}
        </div>
        <div className="prose" style={{ whiteSpace: 'pre-wrap' }}>
          {selected?.content || '(empty)'}
        </div>
      </Modal>
    </div>
  );
}
