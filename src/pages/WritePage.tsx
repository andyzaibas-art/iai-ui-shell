import { useMemo, useState } from "react";
import Modal from '../components/Modal';
import { uid } from '../lib/id';
import { addWriteDraft, type WriteDraft } from '../lib/storage';

export default function WritePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);

  const preview: WriteDraft | null = useMemo(() => {
    const t = title.trim();
    const c = content.trim();
    if (!t && !c) return null;
    return {
      id: uid('write'),
      title: t || 'Untitled',
      content: c,
      createdAt: new Date().toISOString()
    };
  }, [title, content]);

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(null), 2200);
  }

  return (
    <div className="page">
      <div className="card">
        <div className="cardHeader">
          <h2>Write</h2>
          <p className="muted">Local-only draft. No backend.</p>
        </div>

        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
          <label className="field">
            <span className="label">Title</span>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Trip plan, rules, outline"
            />
          </label>

          <label className="field">
            <span className="label">Content</span>
            <textarea
              className="textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing…"
              rows={10}
            />
          </label>

          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="muted" style={{ fontSize: 13 }}>
              Save opens a consent modal (stub).
            </div>

            <button className="btn btnPrimary" type="submit" disabled={!title.trim() && !content.trim()}>
              Save
            </button>
          </div>
        </form>
      </div>

      <Modal
        open={open}
        title="Consent required"
        onClose={() => {
          setOpen(false);
          setConsented(false);
        }}
        footer={
          <div className="row" style={{ justifyContent: 'flex-end', gap: 10 }}>
            <button
              className="btn"
              onClick={() => {
                setOpen(false);
                setConsented(false);
              }}
            >
              Cancel
            </button>
            <button
              className="btn btnPrimary"
              disabled={!preview || !consented}
              onClick={() => {
                if (!preview) return;
                addWriteDraft(preview);
                setOpen(false);
                setConsented(false);
                setTitle('');
                setContent('');
                showToast('Saved locally to History');
              }}
            >
              I Consent & Save
            </button>
          </div>
        }
      >
        <div className="stack">
          <p className="muted">
            This is a UI stub. If you continue, your draft will be stored only on this device (browser
            local storage). No network calls.
          </p>

          <label className="check">
            <input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)} />
            <span>I understand and consent to local-only saving.</span>
          </label>

          <div className="preview">
            <div className="previewTitle">Preview</div>
            <div className="previewBox">
              <div className="previewHeading">{preview ? preview.title : '—'}</div>
              <div className="previewBody">{preview ? preview.content || '—' : '—'}</div>
            </div>
          </div>
        </div>
      </Modal>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
