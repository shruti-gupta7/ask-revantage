import AskRevantageApp from "@/components/ask-revantage-app";

/**
 * Shared client workspace. Keeping the app shell in a layout preserves its
 * conversation state and prevents route pages from remounting it on each
 * sidebar navigation.
 */
export default function WorkspaceLayout() {
  return <AskRevantageApp />;
}
