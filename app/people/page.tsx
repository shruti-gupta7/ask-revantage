import AskRevantageApp from "@/components/ask-revantage-app";
import { metadataFor } from "@/data/page-metadata";

export const metadata = metadataFor("people");

export default function PeopleDirectoryPage() {
  return <AskRevantageApp initialView="people" />;
}
