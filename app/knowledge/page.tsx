import AskRevantageApp from "@/components/ask-revantage-app";
import { metadataFor } from "@/data/page-metadata";

export const metadata = metadataFor("knowledge");

export default function KnowledgePage() {
  return <AskRevantageApp initialView="knowledge" />;
}
