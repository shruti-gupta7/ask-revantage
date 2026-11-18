export type RoutingContact = {
  id: string;
  categories: string[];
  name: string;
  title: string;
  department: string;
  location: string;
  expertise: string[];
  response: string;
  avatar: string;
  teamsUpn?: string;
};

// Fictional directory profiles for the hackathon demonstration.
// Replace them at runtime with approved directory data before production use.
export const ROUTING_CONTACTS: RoutingContact[] = [
  {
    id: "maya-rao",
    categories: ["leave", "benefit", "people", "hr", "parental", "hybrid", "manager"],
    name: "Maya Rao",
    title: "People Services Advisor",
    department: "People Services",
    location: "Bengaluru",
    expertise: ["Leave", "Benefits", "Workplace guidance"],
    response: "Usually responds within one working day",
    avatar: "/assets/avatars/maya-rao.svg",
    teamsUpn: "maya.rao@example.com",
  },
  {
    id: "ethan-brooks",
    categories: ["cab", "transport", "pickup", "drop", "office", "facility", "desk", "visitor"],
    name: "Ethan Brooks",
    title: "Workplace Operations Lead",
    department: "Workplace Operations",
    location: "Bengaluru",
    expertise: ["Office transport", "Facilities", "Visitors"],
    response: "Usually responds within four business hours",
    avatar: "/assets/avatars/ethan-brooks.svg",
    teamsUpn: "ethan.brooks@example.com",
  },
  {
    id: "priya-nair",
    categories: ["expense", "reimburse", "claim", "invoice", "payment"],
    name: "Priya Nair",
    title: "Expense Operations Specialist",
    department: "Finance Operations",
    location: "Bengaluru",
    expertise: ["Expenses", "Reimbursements", "Invoices"],
    response: "Usually responds within one working day",
    avatar: "/assets/avatars/priya-nair.svg",
    teamsUpn: "priya.nair@example.com",
  },
  {
    id: "liam-carter",
    categories: ["travel", "flight", "hotel", "visa", "booking"],
    name: "Liam Carter",
    title: "Travel Services Coordinator",
    department: "Travel Services",
    location: "London",
    expertise: ["Travel booking", "Approvals", "Visa support"],
    response: "Usually responds within one working day",
    avatar: "/assets/avatars/liam-carter.svg",
    teamsUpn: "liam.carter@example.com",
  },
  {
    id: "sofia-malik",
    categories: ["it", "access", "password", "laptop", "system", "software"],
    name: "Sofia Malik",
    title: "Technology Support Analyst",
    department: "Technology Support",
    location: "Chicago",
    expertise: ["Access", "Devices", "Business applications"],
    response: "Usually responds within four business hours",
    avatar: "/assets/avatars/sofia-malik.svg",
    teamsUpn: "sofia.malik@example.com",
  },
  {
    id: "noah-bennett",
    categories: ["security", "phishing", "incident", "data", "mfa"],
    name: "Noah Bennett",
    title: "Security Response Analyst",
    department: "Information Security",
    location: "Chicago",
    expertise: ["Security incidents", "Phishing", "MFA"],
    response: "Urgent security reports are prioritised",
    avatar: "/assets/avatars/noah-bennett.svg",
    teamsUpn: "noah.bennett@example.com",
  },
  {
    id: "anika-shah",
    categories: ["salary", "payroll", "tax", "payslip", "compensation"],
    name: "Anika Shah",
    title: "Payroll Services Advisor",
    department: "Payroll Services",
    location: "Bengaluru",
    expertise: ["Payroll", "Payslips", "Tax declarations"],
    response: "Usually responds within one working day",
    avatar: "/assets/avatars/anika-shah.svg",
    teamsUpn: "anika.shah@example.com",
  },
  {
    id: "daniel-kim",
    categories: ["general", "other", "help", "support"],
    name: "Daniel Kim",
    title: "Employee Services Coordinator",
    department: "Employee Services",
    location: "New York",
    expertise: ["General enquiries", "Service navigation"],
    response: "Usually responds within one working day",
    avatar: "/assets/avatars/daniel-kim.svg",
  },
];

export function routeForQuery(query: string, contacts: RoutingContact[] = ROUTING_CONTACTS) {
  const normalized = query.toLowerCase();
  let best = contacts.find((person) => person.id === "daniel-kim") || contacts[0] || ROUTING_CONTACTS[0];
  let bestScore = 0;
  for (const contact of contacts) {
    const score = contact.categories.reduce((total, word) => total + (normalized.includes(word) ? 2 : 0), 0);
    if (score > bestScore) {
      best = contact;
      bestScore = score;
    }
  }
  return best;
}

export function teamsChatUrl(upn?: string) {
  if (!upn) return null;
  return `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(upn)}`;
}
