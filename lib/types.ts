export type SourceDocument = {
  id: string;
  name: string;
  url?: string;
  downloadUrl?: string;
  fileType?: string;
  location?: string;
  lastSeenAt: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  sources?: SourceDocument[];
  pending?: boolean;
};

export type DirectLineSession = {
  token: string;
  conversationId: string;
  expiresAt: number;
  watermark?: string;
};
