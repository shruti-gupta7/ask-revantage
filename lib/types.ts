export type SourceStatus = "Ready" | "Indexing" | "Needs review";
export type SourceType = "SharePoint" | "OneDrive" | "Excel" | "PDF" | "Website" | "Manual";
export type KnowledgeSource = {
  id: string;
  name: string;
  type: SourceType;
  category: string;
  status: SourceStatus;
  owner: string;
  updated: string;
  location: string;
  content: string;
  dataClass: "Synthetic demo";
  href?: string;
};
export type SupportRequest = {
  id: string;
  subject: string;
  team: string;
  status: "Open" | "In progress" | "Resolved";
  created: string;
  description: string;
};
