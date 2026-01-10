import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initEditor } from "./hooks/useEditor";

if (import.meta.env.DEV || document.referrer?.includes("caffeine.ai")) {
  try {
    initEditor();
  } catch {}
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
