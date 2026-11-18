import type { Metadata } from "next";
import { KnowledgeView } from "@/components/knowledge-view";

export const metadata: Metadata = { title: "Knowledge Library", description: "View documents cited by Ask Revantage Bot." };
export default function KnowledgePage() { return <KnowledgeView/>; }
