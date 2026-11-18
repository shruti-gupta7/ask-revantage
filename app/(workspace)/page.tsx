import type { Metadata } from "next";
import { ChatView } from "@/components/chat-view";

export const metadata: Metadata = { title: "Chat", description: "Ask grounded questions across Revantage knowledge." };
export default function HomePage() { return <ChatView/>; }
