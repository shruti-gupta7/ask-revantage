"use client";

import Image from "next/image";
import { FormEvent, Fragment, useEffect, useRef, useState } from "react";
import { useChat, type ChatMessage } from "@/context/chat-context";
import { BotIcon, DownloadIcon, ExternalIcon, SendIcon } from "./icons";

const prompts = [
  "How do I cancel an assigned cab?",
  "What travel documents should I keep?",
  "Who can help with workplace access?"
];
const trivia = [
  "Ask Revantage checks connected knowledge sources before it answers.",
  "Source cards stay attached to the answer so you can verify the guidance.",
  "The Knowledge Library groups demo files by service area and file type.",
  "This hackathon uses fictional documents. Production access should follow employee permissions."
];

export function ChatView() {
  const { messages, pending, status, send, clear } = useChat();
  const [input, setInput] = useState("");
  const [triviaIndex, setTriviaIndex] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [messages, pending, status]);
  useEffect(() => {
    if (!pending || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setTriviaIndex(index => (index + 1) % trivia.length), 4000);
    return () => clearInterval(timer);
  }, [pending]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    await send(text);
  };

  return <section className="chat-page" aria-label="Ask Revant Bot chat">
    <div className="chat-heading">
      <div><span className="eyebrow">Copilot Studio knowledge assistant</span><h1>One question. One place. One answer.</h1><p>Ask a question and review the supporting sources returned with the answer.</p></div>
      <button className="button secondary" onClick={clear} disabled={pending}>New conversation</button>
    </div>
    <div className="chat-card glass-card">
      <div className="messages" aria-live="polite" aria-busy={pending}>
        {messages.map(message => <MessageBubble key={message.id} message={message} />)}
        {messages.length === 1 && <div className="suggestions" aria-label="Suggested prompts">
          {prompts.map(prompt => <button key={prompt} onClick={() => void send(prompt)} disabled={pending}>{prompt}</button>)}
        </div>}
        {pending && <div className="message-row assistant-row processing-row">
          <div className="bot-avatar"><BotIcon /></div>
          <div className="processing-stack">
            <div className="message-author">Ask Revant Bot</div>
            <div className="processing-bubble">
              <div className="loader-dots" role="status" aria-label="Ask Revant Bot is processing"><i /><i /><i /></div>
              <span>{status || "Working on your answer…"}</span>
            </div>
            <div className="trivia"><strong>Did you know?</strong> {trivia[triviaIndex]}</div>
          </div>
        </div>}
        <div ref={endRef} />
      </div>
      <form className="composer" onSubmit={submit}>
        <label className="sr-only" htmlFor="question">Ask Revant Bot a question</label>
        <textarea id="question" value={input} onChange={event => setInput(event.target.value)} rows={1}
          placeholder={pending ? "Ask Revant Bot is still working…" : "Ask about a policy, process or support service"}
          disabled={pending} onKeyDown={event => {
            if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
          }} />
        <button className="send-button" type="submit" disabled={pending || !input.trim()} aria-label="Send question"><SendIcon /></button>
      </form>
      <div className="composer-note">Ask Revantage can make mistakes. Verify important guidance in the supporting source.</div>
    </div>
  </section>;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const user = message.role === "user";
  return <div className={`message-row ${user ? "user-row" : "assistant-row"} ${message.role === "error" ? "error-row" : ""}`}>
    {!user && <div className="bot-avatar"><BotIcon /></div>}
    <div className="message-content">
      <div className="message-author">{user ? "Shruti Gupta" : message.role === "error" ? "Connection notice" : "Ask Revant Bot"}</div>
      <div className="message-bubble">{user ? message.text : <RichText text={message.text} />}</div>
      {!!message.sources?.length && <div className="source-section">
        <div className="source-label">Supporting sources</div>
        <div className="source-grid">{message.sources.map((source, index) => <article className="source-card" key={`${source.url}-${index}`}>
          <span className="file-chip">{source.fileType}</span>
          <div className="source-copy"><strong>{source.title}</strong><span>Returned by Copilot Studio</span></div>
          <div className="source-actions">
            <a href={source.url} target="_blank" rel="noreferrer"><ExternalIcon />Open</a>
            <a href={source.downloadUrl} target="_blank" rel="noreferrer" download><DownloadIcon />Download</a>
          </div>
        </article>)}</div>
      </div>}
    </div>
    {user && <Image className="message-avatar" src="/assets/shruti-gupta-avatar.jpg" alt="" width={34} height={34} />}
  </div>;
}

function RichText({ text }: { text: string }) {
  return <>{text.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{renderInlineLinks(paragraph)}</p>)}</>;
}

function renderInlineLinks(text: string) {
  const parts = text.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
  return parts.map((part, index) => {
    const match = part.match(/^\[([^\]]+)]\((https?:\/\/[^)]+)\)$/);
    return match ? <a key={index} href={match[2]} target="_blank" rel="noreferrer">{match[1]}</a> : <Fragment key={index}>{part}</Fragment>;
  });
}
