import AskRevantageApp from "@/components/ask-revantage-app";
import { metadataFor } from "@/data/page-metadata";

export const metadata = metadataFor("routes");

export default function SupportPage() {
  return <AskRevantageApp initialView="routes" />;
}
