"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { DirectLineClient, type SourceDocument } from "@/lib/direct-line-client";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "error";
  text: string;
  sources?: SourceDocument[];
  createdAt: number;
};

type ChatContextValue = {
  messages: ChatMessage[];
  pending: boolean;
  status: string;
  send: (text: string) => Promise<void>;
  clear: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);
const welcome: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Hello Shruti. I’m Ask Revant Bot. Ask me a question and I’ll check the connected knowledge sources before I answer.",
  createdAt: Date.now()
};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<DirectLineClient | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => () => clientRef.current?.dispose(), []);

  const send = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text || pending) return;
    const client = clientRef.current || new DirectLineClient("Shruti Gupta");
    clientRef.current = client;
    setMessages(current => [...current, { id: crypto.randomUUID(), role: "user", text, createdAt: Date.now() }]);
    setPending(true);
    setStatus("Connecting to Ask Revant Bot…");
    try {
      const result = await client.sendMessage(text, { onStatus: setStatus });
      setMessages(current => [...current, {
        id: crypto.randomUUID(), role: "assistant", text: result.text, sources: result.sources, createdAt: Date.now()
      }]);
    } catch (error) {
      setMessages(current => [...current, {
        id: crypto.randomUUID(), role: "error",
        text: error instanceof Error ? error.message : "Ask Revant Bot could not complete the request.",
        createdAt: Date.now()
      }]);
    } finally {
      setPending(false);
      setStatus("");
    }
  }, [pending]);

  const clear = useCallback(() => setMessages([{ ...welcome, id: crypto.randomUUID(), createdAt: Date.now() }]), []);
  return <ChatContext.Provider value={{ messages, pending, status, send, clear }}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used inside ChatProvider.");
  return context;
}
