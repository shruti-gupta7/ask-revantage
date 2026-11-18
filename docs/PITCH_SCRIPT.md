# Ask Revantage — 5-minute pitch

## 0:00–1:00 — Problem

Employees know the answer exists, but not where it lives. A leave question may be in a policy library, a cab question in a facilities guide, and an access question in a service portal. Searching takes time, and asking the wrong team creates more handoffs.

**Ask Revantage gives every employee one trusted front door.** It finds a source-linked answer when approved knowledge exists and creates a trackable request when it does not.

## 1:00–3:00 — Live demo

1. Open the User workspace and ask: “How does the sample office cab facility work?”
2. Show the answer, confidence indicator and synthetic source citation.
3. Ask an intentionally unsupported question. Show that the system does not guess; it classifies and routes a request.
4. Switch to Admin. Add a synthetic source, highlighting the mandatory data declaration.
5. Show source health, routing queue, insights and the Microsoft-first production architecture.

Call out that every visible person, policy, request and metric is synthetic. No production connector or real company data is used.

## 3:00–4:00 — Business value and measurement

The value hypothesis is faster self-service, fewer handoffs and more consistent answers. Proposed pilot measures:

- Median time to find an answer
- Percentage resolved through approved knowledge
- Support tickets avoided or correctly routed first time
- Answer groundedness and citation rate
- Employee satisfaction after each answer
- Content gaps converted into reviewed knowledge

Illustrative ROI model (replace with approved pilot evidence):

```text
monthly benefit = eligible questions × minutes saved × approved loaded labor rate
net benefit = monthly benefit − hosting, support and content-governance cost
```

No ROI figure is claimed from synthetic demo data.

## 4:00–5:00 — Budget, ask and scale

**Pilot ask:** a product owner, one engineer, a knowledge lead, Security/Privacy reviewers and representatives from People, Workplace, Technology and Finance. Start with a small allow-listed set of non-sensitive sources and a limited employee group.

The app is deployable now as a safe demo. Production follows a realistic path: Entra ID, permission-aware SharePoint ingestion, Azure AI Search, an approved Azure OpenAI deployment and Power Automate or service-management routing.

**Close:** Ask Revantage makes finding help feel simple while keeping trust, ownership and human judgment visible.

## Likely judge questions

- **How do you prevent hallucinations?** Retrieval is limited to approved sources, every answer shows evidence and low confidence triggers human escalation.
- **How do you protect confidential data?** This hackathon build uses synthetic data only. Production requires permission-aware retrieval, DLP, audit logs and security review.
- **Why not just search SharePoint?** Ask Revantage provides one conversational layer, consistent citations, cross-service routing and measurable content-gap feedback.
- **Can it scale across companies?** Metadata and adapter boundaries support separate permissions, brands, geographies and workflows without rebuilding the core experience.
