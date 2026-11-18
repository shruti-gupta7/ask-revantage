import AskRevantageApp from "@/components/ask-revantage-app";
import { metadataFor } from "@/data/page-metadata";

export const metadata = metadataFor("ask");

export default function HomePage() {
  return <AskRevantageApp initialView="ask" />;
}
