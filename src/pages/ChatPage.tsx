import { useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAppMode } from "../contexts/AppModeContext";

type Role = "user" | "assistant";
interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const { projectType } = useAppMode();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const projectLabel = useMemo(() => {
    if (!projectType) return null;
    return projectType === "not sure" ? "Not sure" : projectType;
  }, [projectType]);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileWidth = window.innerWidth < 768;
      const isMobileUA =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      setIsMobile(isMobileWidth || isMobileUA);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
    el.style.overflowY = el.scrollHeight > 220 ? "auto" : "hidden";
  };

  useEffect(() => {
    autoResize();
  }, [input]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((p) => [...p, userMsg]);
    setInput("");

    setTimeout(() => {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I understand. Let me help you with that.",
        timestamp: new Date(),
      };
      setMessages((p) => [...p, assistantMsg]);
    }, 400);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;

    if (isMobile) {
      // mobile: enter = new line
      return;
    }

    // desktop: Enter sends, Shift+Enter new line
    if (!e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showHint = isMobile && !isFocused && !input.trim();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Messages (only scroll container) */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="py-16 text-center text-neutral-400">
              <div className="text-xl text-neutral-200">Where should we begin?</div>
              <div className="mt-2 text-sm text-neutral-500">
                {projectLabel ? `Mode: ${projectLabel}` : "Start typing below."}
              </div>
            </div>
          ) : null}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={[
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  m.role === "user"
                    ? "bg-neutral-100 text-neutral-900"
                    : "bg-neutral-900/40 text-neutral-100 border border-neutral-800",
                ].join(" ")}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {m.content}
                </div>
                <div className="mt-1.5 text-xs opacity-60">
                  {m.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 border-t border-neutral-900 bg-neutral-950">
        <div className="mx-auto max-w-3xl px-4 py-4">
          {/* Mobile */}
          <div className="md:hidden">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Type your message..."
                className="w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-3 pr-12 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-600"
                style={{ minHeight: "56px", height: "56px", overflowY: "hidden" }}
              />
              <Button
                type="button"
                size="icon"
                onClick={handleSend}
                disabled={!input.trim()}
                className="absolute right-2 bottom-2 h-10 w-10 rounded-lg"
                aria-label="Send"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            {showHint ? (
              <div className="mt-2 text-xs text-neutral-500 text-center">
                Enter = new line · Use Send button to send
              </div>
            ) : null}
          </div>

          {/* Desktop */}
          <div className="hidden md:flex gap-3 items-end">
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-600"
                style={{ minHeight: "64px", height: "64px", overflowY: "hidden" }}
              />
            </div>
            <Button
              type="button"
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
              className="h-14 w-14 rounded-xl"
              aria-label="Send"
            >
              <Send className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
