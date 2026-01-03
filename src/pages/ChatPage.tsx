import React, { useMemo, useRef, useState } from 'react';
import { uid } from '../lib/id';

type Msg = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
};

const quickActions = [
  {
    label: 'Surask bilietus ✈️',
    prompt: 'Surask pigiausius skrydžius Vilnius → Roma kitą mėnesį.'
  },
  {
    label: 'Kelionė už biudžetą 💶',
    prompt: 'Pasiūlyk savaitgalio kelionę dviem už 300€ su nakvyne.'
  },
  {
    label: 'Su nakvyne + maistu 🍽️',
    prompt: 'Suplanuok 2 dienų išvyką su nakvyne ir pusryčiais.'
  },
  {
    label: 'Klausimai patikslinimui ❓',
    prompt: 'Kokius 5 patikslinimo klausimus turėtum užduoti prieš planuojant kelionę?'
  }
] as const;

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: uid('m'),
      role: 'assistant',
      text:
        'UI shell only. No Internet Identity, no backend, no canister calls. Messages here are local and reset on refresh.',
      ts: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  const sorted = useMemo(() => {
    return [...messages].sort((a, b) => a.ts - b.ts);
  }, [messages]);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    });
  }

  function send(text: string) {
    const t = text.trim();
    if (!t) return;

    const now = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: uid('m'), role: 'user', text: t, ts: now },
      {
        id: uid('m'),
        role: 'assistant',
        text:
          'Stub response (local). Later this is where an agent / canister integration would respond, possibly asking clarifying questions and running commands.',
        ts: now + 1
      }
    ]);
    setInput('');
    scrollToBottom();
  }

  return (
    <div className="page">
      <div className="sectionHeading">Quick actions</div>
      <div className="chips" role="list" aria-label="Quick actions">
        {quickActions.map((qa) => (
          <button
            key={qa.label}
            className="chip"
            type="button"
            onClick={() => setInput(qa.prompt)}
            role="listitem"
          >
            {qa.label}
          </button>
        ))}
      </div>

      <div className="chatFrame" aria-label="Chat">
        <div className="chatList" ref={listRef}>
          {sorted.map((m) => (
            <div key={m.id} className={`msgRow ${m.role === 'user' ? 'msgUser' : 'msgAsst'}`}>
              <div className="msgBubble">
                <div className="msgRole">{m.role === 'user' ? 'You' : 'I.A.I'}</div>
                <div className="msgText">{m.text}</div>
              </div>
            </div>
          ))}
        </div>

        <form
          className="chatComposer"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <textarea
            className="chatInput"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
          />
          <button className="primaryBtn" type="submit">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
