import type { KnowledgeSource, SupportRequest } from "./types";

const seedSources: KnowledgeSource[] = [
  {
    id: "src-hr-001", name: "SAMPLE — Leave & Time Away Guide", type: "SharePoint",
    category: "People & HR", status: "Ready", owner: "Sample People Team", updated: "12 Nov 2026",
    location: "Synthetic People Hub / Sample Policies",
    content: "SYNTHETIC SAMPLE: Demo employees can review example annual leave, sick leave, optional holiday and carry-forward guidance in this fictional guide. Requests use a fictional HR workflow. This content is not a real company policy.",
    dataClass: "Synthetic demo"
  },
  {
    id: "src-travel-002", name: "SAMPLE — Office Cab & Safe Travel Guide", type: "OneDrive",
    category: "Travel & Facilities", status: "Ready", owner: "Sample Workplace Team", updated: "08 Nov 2026",
    location: "Synthetic Workplace Hub / Sample Office",
    content: "SYNTHETIC SAMPLE: The fictional cab guide describes example office routes, late-evening travel support, booking cut-offs and cancellations. Demo employees use a non-production transport channel. This content is not an actual facility commitment.",
    dataClass: "Synthetic demo"
  },
  {
    id: "src-it-003", name: "SAMPLE — Technology Access Guide", type: "SharePoint",
    category: "Technology", status: "Ready", owner: "Sample Technology Team", updated: "03 Nov 2026",
    location: "Synthetic Technology Hub / Guides",
    content: "SYNTHETIC SAMPLE: Demo users submit example access, software and device requests through a fictional service portal. Suspected security issues should follow approved organizational channels in a real deployment. Never share credentials or approve an unexpected multifactor prompt.",
    dataClass: "Synthetic demo"
  },
  {
    id: "src-fin-004", name: "SAMPLE — Expense & Reimbursement Guide", type: "Website",
    category: "Finance", status: "Ready", owner: "Sample Finance Team", updated: "28 Oct 2026",
    location: "Synthetic Finance Hub / Expenses",
    content: "SYNTHETIC SAMPLE: Fictional business expenses include an example business purpose, itemized receipt and sample cost allocation. Demo claims use invented timelines and approval steps. This content must not be treated as financial policy.",
    dataClass: "Synthetic demo"
  },
  {
    id: "src-fac-005", name: "SAMPLE — Office Services Catalog", type: "Manual",
    category: "Travel & Facilities", status: "Indexing", owner: "Sample Workplace Team", updated: "18 Nov 2026",
    location: "Synthetic admin draft",
    content: "SYNTHETIC SAMPLE: Fictional office services include visitor access, meeting rooms, workplace support, cab coordination and example facilities requests.",
    dataClass: "Synthetic demo"
  },
  {
    id: "src-hr-pdf-006", name: "SAMPLE — People Leave & Time Away Policy", type: "PDF",
    category: "People & HR", status: "Ready", owner: "Sample People Team", updated: "18 Nov 2026",
    location: "Bundled synthetic PDF",
    content: "SYNTHETIC SAMPLE: This fictional HR policy document demonstrates purpose, scope, invented leave categories, a sample request process, responsibilities, privacy and responsible AI. It is not a real company policy.",
    dataClass: "Synthetic demo", href: "/demo-data/synthetic-hr-policy.pdf"
  },
  {
    id: "src-xlsx-007", name: "SAMPLE — Workplace Service Matrix", type: "Excel",
    category: "Travel & Facilities", status: "Ready", owner: "Sample Workplace Team", updated: "16 Nov 2026",
    location: "Synthetic OneDrive / Demo workbook",
    content: "SYNTHETIC SAMPLE: An invented workbook maps fictional office services to sample hours, request categories and non-production support queues.",
    dataClass: "Synthetic demo"
  }
];

const seedRequests: SupportRequest[] = [
  { id: "AR-1042", subject: "Sample cab stop update", team: "Sample Workplace Team", status: "In progress", created: "17 Nov 2026", description: "Synthetic request to update a fictional cab stop." },
  { id: "AR-1038", subject: "Sample expense category question", team: "Sample Finance Team", status: "Resolved", created: "14 Nov 2026", description: "Synthetic request about an invented expense category." }
];

declare global {
  var askRevantageSources: KnowledgeSource[] | undefined;
  var askRevantageRequests: SupportRequest[] | undefined;
}
export const sources = globalThis.askRevantageSources ??= structuredClone(seedSources);
export const requests = globalThis.askRevantageRequests ??= structuredClone(seedRequests);
