import { ChatProvider } from "@/context/chat-context";
import { WorkspaceShell } from "@/components/workspace-shell";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <ChatProvider><WorkspaceShell>{children}</WorkspaceShell></ChatProvider>;
}
