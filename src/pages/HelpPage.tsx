
export default function HelpPage() {
  return (
    <div className="page">
      <div className="card">
        <div className="cardHeader">
          <h2>Help</h2>
          <p className="muted">This is a minimal UI shell. No backend calls.</p>
        </div>

        <div className="stack">
          <div>
            <h3>Keyboard</h3>
            <ul className="list">
              <li><span className="kbd">Enter</span> send message (Chat)</li>
              <li><span className="kbd">Shift</span>+<span className="kbd">Enter</span> newline (Chat)</li>
            </ul>
          </div>

          <div>
            <h3>Local-only saves</h3>
            <p className="muted">Write drafts are stored in your browser (localStorage). Use History to review.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
