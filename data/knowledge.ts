export type PolicySection = {
  title: string;
  answer: string;
  keywords: string[];
};

export type PolicyDocument = {
  id: string;
  title: string;
  category: string;
  description: string;
  version: string;
  effective: string;
  owner: string;
  href: string;
  sections: PolicySection[];
};

export type RoutingContact = {
  id: string;
  categories: string[];
  name: string;
  routeLabel: string;
  team: string;
  response: string;
  avatar: string;
};

export const POLICIES: PolicyDocument[] = [
  {
    id: "people-leave",
    title: "People & Leave Handbook",
    category: "People & Leave",
    description: "Annual leave, carry-forward, sick leave, parental leave, and flexible work.",
    version: "1.3",
    effective: "1 Apr 2026",
    owner: "People Services",
    href: "/documents/people-and-leave-handbook.md",
    sections: [
      {
        title: "Annual leave",
        answer: "Users receive 24 working days of annual leave in each calendar year. Request leave in the people portal and obtain reporting-manager approval before making travel plans.",
        keywords: ["annual leave", "vacation", "leave entitlement", "how many leave days", "holiday allowance"],
      },
      {
        title: "Carry-forward",
        answer: "Up to 5 unused annual leave days may be carried into the next calendar year. Carried leave should be used by 31 March; any remaining carried balance expires after that date.",
        keywords: ["carry forward", "carry-forward", "unused leave", "leave balance", "31 march"],
      },
      {
        title: "Sick leave",
        answer: "Users may take up to 10 working days of paid sick leave each calendar year. A medical certificate is required from the third consecutive working day.",
        keywords: ["sick leave", "medical certificate", "illness", "unwell"],
      },
      {
        title: "Parental leave",
        answer: "Primary caregivers may take 26 weeks of paid parental leave. Secondary caregivers may take 20 working days within six months of the child joining the family.",
        keywords: ["parental leave", "maternity", "paternity", "caregiver", "new child"],
      },
      {
        title: "Flexible work",
        answer: "Hybrid work arrangements are agreed with the reporting manager and depend on team coverage, role requirements, and local office guidance.",
        keywords: ["hybrid", "work from home", "remote work", "flexible work", "office days"],
      },
    ],
  },
  {
    id: "cab-transport",
    title: "Cab & Late-Night Transport Policy",
    category: "Cab & Transport",
    description: "Eligibility, booking cut-offs, cancellations, safety, delays, and taxi exceptions.",
    version: "2.1",
    effective: "15 May 2026",
    owner: "Workplace Operations",
    href: "/documents/cab-and-late-night-transport-policy.md",
    sections: [
      {
        title: "Eligibility",
        answer: "Office transport is available for approved late shifts ending at or after 8:30 PM and early shifts beginning at or before 6:30 AM. Eligibility follows the published shift roster.",
        keywords: ["cab eligibility", "late shift", "early shift", "office transport", "8:30", "6:30"],
      },
      {
        title: "Booking a cab",
        answer: "Book by 4:00 PM for the same evening and by 6:00 PM on the previous working day for an early pickup. Include the location, mobile number, cost centre, and manager approval reference.",
        keywords: ["book cab", "book a cab", "cab booking", "transport booking", "pickup", "drop", "booking deadline", "cab policy"],
      },
      {
        title: "Changes and cancellation",
        answer: "Cancel at least two hours before pickup. Two avoidable no-shows within 30 days may require manager approval for the next booking.",
        keywords: ["cancel cab", "cab cancellation", "no show", "change cab", "missed cab"],
      },
      {
        title: "Safety",
        answer: "Verify the vehicle number and driver name before boarding, and use trip sharing for late-night drops. Report any route or safety concern to Workplace Operations immediately.",
        keywords: ["cab safety", "driver", "vehicle number", "trip share", "unsafe", "route concern"],
      },
      {
        title: "Delay and reimbursement",
        answer: "If the cab is more than 15 minutes late, contact the transport desk. A taxi reimbursement is considered only when the approved cab fails and the desk records an exception; submit the receipt and reference within five working days.",
        keywords: ["cab late", "cab delayed", "cab not arrived", "taxi reimbursement", "replacement taxi", "15 minutes"],
      },
    ],
  },
  {
    id: "travel-expense",
    title: "Travel & Expense Guide",
    category: "Travel & Expenses",
    description: "Approvals, booking channels, eligible expenses, exclusions, and claim timing.",
    version: "1.8",
    effective: "1 Jun 2026",
    owner: "Finance Operations",
    href: "/documents/travel-and-expense-guide.md",
    sections: [
      {
        title: "Travel approval",
        answer: "Create a travel request with purpose, dates, destination, estimated cost, and cost centre. Manager approval is required before confirming flights or hotels.",
        keywords: ["travel approval", "business trip", "flight approval", "hotel approval", "before booking"],
      },
      {
        title: "Approved booking channel",
        answer: "Book through the approved travel portal. Direct bookings require a documented exception from Travel Support.",
        keywords: ["book flight", "book hotel", "travel portal", "direct booking", "booking channel"],
      },
      {
        title: "Reimbursable expenses",
        answer: "Reasonable ground transport, approved accommodation, business meals within the published limit, visa fees, and required connectivity charges may be reimbursed with itemised receipts.",
        keywords: ["reimbursable", "eligible expense", "expense reimbursement", "travel expenses", "meals", "visa fee", "receipt"],
      },
      {
        title: "Submitting a claim",
        answer: "Submit the expense claim within 10 working days after the trip with itemised receipts, the approved travel request, and an explanation for any exception.",
        keywords: ["submit claim", "expense claim", "claim deadline", "10 working days", "receipts"],
      },
    ],
  },
  {
    id: "it-security",
    title: "IT Access & Security Guide",
    category: "IT & Security",
    description: "System access, passwords, multifactor authentication, incidents, and data handling.",
    version: "1.5",
    effective: "10 Mar 2026",
    owner: "Technology Support",
    href: "/documents/it-access-and-security-guide.md",
    sections: [
      {
        title: "Access requests",
        answer: "Request application access through the service portal with the business reason, required role, manager approval, and an end date for temporary access.",
        keywords: ["access request", "system access", "application access", "permission", "temporary access"],
      },
      {
        title: "Security incident",
        answer: "Report suspected phishing, lost devices, unexpected multifactor prompts, or possible data exposure immediately through the security incident option in the service portal.",
        keywords: ["security incident", "phishing", "lost device", "mfa prompt", "data exposure", "report incident"],
      },
      {
        title: "Data handling",
        answer: "Store work information only in approved Microsoft 365 locations. Do not forward files to personal accounts or upload them to unapproved services.",
        keywords: ["data handling", "personal email", "store files", "microsoft 365", "share data"],
      },
    ],
  },
  {
    id: "workplace-facilities",
    title: "Workplace & Facilities Guide",
    category: "Workplace & Facilities",
    description: "Office access, desk booking, visitors, and workplace issue reporting.",
    version: "1.2",
    effective: "20 Feb 2026",
    owner: "Workplace Operations",
    href: "/documents/workplace-and-facilities-guide.md",
    sections: [
      {
        title: "Office access",
        answer: "Use your assigned access badge, report a lost badge immediately, and never lend a badge to another person.",
        keywords: ["office access", "access badge", "lost badge", "building access"],
      },
      {
        title: "Desk and room booking",
        answer: "Reserve desks and meeting rooms through the workplace booking tool. Release reservations you no longer need so others can use the space.",
        keywords: ["desk booking", "meeting room", "reserve desk", "room booking"],
      },
      {
        title: "Visitors",
        answer: "Register visitors by 3:00 PM on the previous working day. The host must meet the visitor at reception and remain responsible for the visit.",
        keywords: ["visitor", "guest", "reception", "visitor registration"],
      },
      {
        title: "Workplace issue",
        answer: "Use the facilities request route for maintenance, temperature, cleaning, or workspace issues. Add the floor, nearest room or desk number, and a photo when useful.",
        keywords: ["facilities issue", "maintenance", "temperature", "cleaning", "workspace issue", "office issue"],
      },
    ],
  },
];

export const ROUTING_CONTACTS: RoutingContact[] = [
  {
    id: "people",
    categories: ["leave", "benefit", "people", "hr", "parental", "hybrid", "manager"],
    name: "A P Varsha",
    routeLabel: "People Services route",
    team: "People Services",
    response: "Usually responds within one working day",
    avatar: "/assets/avatars/ap-varsha.svg",
  },
  {
    id: "workplace",
    categories: ["cab", "transport", "pickup", "drop", "office", "facility", "desk", "visitor", "travel"],
    name: "Jagjeet Singh",
    routeLabel: "Workplace & transport route",
    team: "Workplace Operations",
    response: "Usually responds within four business hours",
    avatar: "/assets/avatars/jagjeet-singh.svg",
  },
  {
    id: "finance",
    categories: ["expense", "reimburse", "claim", "invoice", "payroll", "salary", "tax", "payment"],
    name: "Shruti Gupta",
    routeLabel: "Finance support route",
    team: "Finance Operations",
    response: "Usually responds within one working day",
    avatar: "/assets/avatars/shruti-gupta.svg",
  },
  {
    id: "technology",
    categories: ["it", "security", "access", "password", "laptop", "system", "phishing", "software"],
    name: "Bhuvan GP",
    routeLabel: "Technology support route",
    team: "Technology Support",
    response: "Urgent security reports are prioritised",
    avatar: "/assets/avatars/bhuvan-gp.svg",
  },
];

const STOP_WORDS = new Set(["the", "and", "for", "that", "with", "from", "this", "what", "when", "where", "which", "how", "can", "are", "our", "your", "about", "please", "tell", "policy", "need", "user"]);

function tokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9:\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

export function routeForQuery(query: string) {
  const normalized = query.toLowerCase();
  let best = ROUTING_CONTACTS[0];
  let bestScore = -1;
  for (const contact of ROUTING_CONTACTS) {
    const score = contact.categories.reduce((total, word) => total + (normalized.includes(word) ? 2 : 0), 0);
    if (score > bestScore) {
      best = contact;
      bestScore = score;
    }
  }
  return best;
}

export function matchKnowledge(query: string) {
  const normalized = query.toLowerCase();
  const queryTokens = tokens(query);
  let best:
    | { policy: PolicyDocument; section: PolicySection; score: number }
    | undefined;

  for (const policy of POLICIES) {
    for (const section of policy.sections) {
      const sectionText = `${section.title} ${section.answer}`.toLowerCase();
      const documentText = `${policy.title} ${policy.category}`.toLowerCase();
      const phraseScore = Math.max(
        0,
        ...section.keywords.map((phrase) => {
          const phraseTokens = tokens(phrase);
          const exact = normalized.includes(phrase.toLowerCase()) ? 12 : 0;
          const overlap = phraseTokens.reduce((count, token) => count + (queryTokens.includes(token) ? 3 : 0), 0);
          return exact + overlap;
        }),
      );
      const titleScore = tokens(section.title).reduce((score, token) => score + (queryTokens.includes(token) ? 4 : 0), 0);
      const textScore = queryTokens.reduce((score, token) => score + (sectionText.includes(token) ? 1 : 0), 0);
      const documentScore = Math.min(3, queryTokens.reduce((score, token) => score + (documentText.includes(token) ? 1 : 0), 0));
      const score = phraseScore + titleScore + textScore + documentScore;
      if (!best || score > best.score) best = { policy, section, score };
    }
  }

  return best && best.score >= 4 ? best : undefined;
}
