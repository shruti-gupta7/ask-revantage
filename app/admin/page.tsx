import AskRevantageApp from "@/components/ask-revantage-app";
import { metadataFor } from "@/data/page-metadata";

export const metadata = metadataFor("admin");

export default function AdminPage() {
  return <AskRevantageApp initialView="admin" />;
}
