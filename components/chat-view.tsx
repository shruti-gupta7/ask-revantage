"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { BotIcon, DownloadIcon, OpenIcon, SendIcon } from "@/components/icons";
import { askCopilot, createDirectLineSession } from "@/lib/directline";
import { storeSources } from "@/lib/source-storage";
import type { ChatMessage, DirectLineSession } from "@/lib/types";

const MESSAGE_KEY = "ask-revantage-chat-v4";
const SESSION_KEY = "ask-revantage-directline-v4";
const USER_KEY = "ask-revantage-user-v1";
const prompts = [
  "What is the late-night cab policy?",
  "Summarise the employee leave policy.",
  "Which documents explain travel reimbursements?",
];
const trivia = [
  "Policy answers can include links to the documents used as sources.",
  "The Knowledge Library collects documents cited during this conversation.",
  "You can ask follow-up questions without repeating the full policy name.",
  "Ask for a summary, an eligibility rule, or the exact supporting document.",
];
const welcome: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Hi Shruti. I am Ask Revantage Bot. Ask me about policies, procedures, or internal knowledge and I will look for a grounded answer.",
  createdAt: new Date(0).toISOString(),
};

function loadMessages() {
  if (typeof window === "undefined") return [welcome];
  try {
    const stored = JSON.parse(sessionStorage.getItem(MESSAGE_KEY) || "[]") as ChatMessage[];
    return Array.isArray(stored) && stored.length ? stored : [welcome];
  } catch { return [welcome]; }
}

function userId() {
  let value = localStorage.getItem(USER_KEY);
  if (!value) { value = crypto.randomUUID(); localStorage.setItem(USER_KEY, value); }
  return value;
}

function SourceActions({ sources }: { sources: NonNullable<ChatMessage["sources"]> }) {
  if (!sources.length) return null;
  return <div className="message-sources" aria-label="Supporting documents">
    <span className="source-heading">Sources used</span>
    {sources.map((source) => <div className="source-row" key={source.id}>
      <div><strong>{source.name}</strong>{source.location && <span>{source.location}</span>}</div>
      <div className="source-actions">
        {source.url && <a href={source.url} target="_blank" rel="noreferrer"><OpenIcon size={14}/>Open</a>}
        {(source.downloadUrl || source.url) && <a href={source.downloadUrl || source.url} target="_blank" rel="noreferrer" download><DownloadIcon size={14}/>Download</a>}
      </div>
    </div>)}
  </div>;
}

export function ChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const sessionRef = useRef<DirectLineSession | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(loadMessages());
    try {
      const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null") as DirectLineSession | null;
      if (session?.token && session.expiresAt > Date.now() + 60_000) sessionRef.current = session;
    } catch { sessionRef.current = null; }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(MESSAGE_KEY, JSON.stringify(messages));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, hydrated]);

  useEffect(() => {
    if (!waiting) return;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const timer = setInterval(() => setTriviaIndex((index) => (index + 1) % trivia.length), 4000);
    return () => clearInterval(timer);
  }, [waiting]);

  const availablePrompts = useMemo(() => messages.length <= 1 ? prompts : [], [messages.length]);

  async function submitQuestion(question: string) {
    const value = question.trim();
    if (!value || waiting) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", text: value, createdAt: new Date().toISOString() };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setWaiting(true);
    setTriviaIndex(0);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const id = userId();
      let session = sessionRef.current;
      if (!session || session.expiresAt <= Date.now() + 60_000) session = await createDirectLineSession(id);
      sessionRef.current = session;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      const answer = await askCopilot(session, id, value, controller.signal);
      sessionRef.current = answer.session;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(answer.session));
      storeSources(answer.sources);
      setMessages((current) => [...current, {
        id: crypto.randomUUID(), role: "assistant", text: answer.text, sources: answer.sources, createdAt: new Date().toISOString(),
      }]);
    } catch (error) {
      if ((error as Error).name !== "AbortError") setMessages((current) => [...current, {
        id: crypto.randomUUID(), role: "assistant", text: (error as Error).message || "I could not complete that request. Please try again.", createdAt: new Date().toISOString(),
      }]);
    } finally {
      setWaiting(false);
      abortRef.current = null;
    }
  }

  function onSubmit(event: FormEvent) { event.preventDefault(); void submitQuestion(input); }

  return <section className="chat-stage" aria-label="Ask Revantage chat">
    <div className="chat-widget">
      <div className="chat-widget-header">
        <div className="bot-avatar"><BotIcon size={22}/></div>
        <div><h2>Ask Revantage Bot</h2><p><span className="status-dot"/>Connected to Copilot Studio</p></div>
      </div>
      <div className="message-list" ref={scrollRef} aria-live="polite">
        <div className="chat-intro">
          <span className="eyebrow">REVANTAGE KNOWLEDGE</span>
          <h3>How can I help today?</h3>
          <p>Ask about a policy or process. Supporting documents appear with the answer when Copilot provides them.</p>
        </div>
        {availablePrompts.length > 0 && <div className="prompt-pills" aria-label="Suggested prompts">
          {availablePrompts.map((prompt) => <button key={prompt} onClick={() => void submitQuestion(prompt)}>{prompt}</button>)}
        </div>}
        {messages.map((message) => <article className={`message ${message.role}`} key={message.id}>
          {message.role === "assistant" ? <div className="message-avatar bot"><BotIcon size={17}/></div> : <Image className="message-avatar" src="/assets/shruti-gupta-avatar.jpg" alt="Shruti Gupta" width={34} height={34}/>} 
          <div className="message-content"><div className="message-name">{message.role === "assistant" ? "Ask Revantage Bot" : "Shruti Gupta"}</div><div className="message-bubble">{message.text}</div>{message.sources && <SourceActions sources={message.sources}/>}</div>
        </article>)}
        {waiting && <article className="message assistant waiting-message">
          <div className="message-avatar bot"><BotIcon size={17}/></div>
          <div className="message-content"><div className="message-name">Ask Revantage Bot</div><div className="message-bubble loading-bubble"><span/><span/><span/><b>Working on your answer</b></div><p className="trivia"><strong>Did you know?</strong> {trivia[triviaIndex]}</p></div>
        </article>}
      </div>
      <form className="composer" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="question">Ask a question</label>
        <textarea id="question" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submitQuestion(input); } }} placeholder="Ask about a Revantage policy or process..." rows={1} disabled={waiting}/>
        <button className="send-button" disabled={!input.trim() || waiting} aria-label="Send question"><SendIcon size={19}/></button>
      </form>
      <div className="chat-footer">Answers use available knowledge sources. Verify important decisions against the source document.</div>
    </div>
  </section>;
}
