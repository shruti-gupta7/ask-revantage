# Architecture and production path

## Demo architecture

```text
Next.js user/admin interface
        │
        ├── POST /api/ask      → deterministic retrieval over synthetic seed data
        ├── GET/POST /api/sources → in-memory synthetic source registry
        ├── GET/POST /api/requests → in-memory synthetic routing queue
        └── GET /api/health    → deployment health
```

The demo is intentionally stateless and non-production. It demonstrates the full user journey without connecting to real systems or storing user inputs beyond the current server process.

## Target Microsoft architecture

```text
Microsoft Entra ID
  ├── Employee role
  └── Knowledge Admin security group
        │
Microsoft Graph / approved SharePoint sites
        │ permission-aware ingestion
Azure Functions or Container Apps
        │ chunking, classification, metadata and policy lifecycle
Azure AI Search
        │ hybrid retrieval + security filters
Copilot Studio agent (or approved Azure OpenAI orchestration)
        │ grounded answer with citations, confidence and safety controls
Next.js on approved hosting
        │
Power Automate / service management connector for escalations
```

## Replaceable adapter seams

- `app/api/ask/route.ts`: replace keyword ranking with an approved retrieval service.
- `lib/copilot-studio.ts`: optional HTTPS-only server-side adapter for an approved Copilot Studio agent broker.
- `app/api/sources/route.ts`: replace in-memory storage with source registration and ingestion jobs.
- `app/api/requests/route.ts`: replace the demo queue with Power Automate, ServiceNow, Jira or another approved workflow.
- `lib/safety.ts`: extend input classification, DLP and policy controls.

## Security and governance controls for production

1. Entra ID authentication and group-based admin authorization.
2. Permission-aware retrieval; the answer service must never broaden a user’s source access.
3. Encryption in transit and at rest, managed identities and secrets in an approved vault.
4. DLP, malware scanning, source allow-lists and document classification before indexing.
5. Audit logs for source changes, retrievals, feedback and request routing.
6. Retention, deletion and regional-residency rules approved by Privacy, Legal and Security.
7. Responsible-AI evaluation for groundedness, harmful content, bias, privacy leakage and prompt injection.
8. Human escalation when confidence is low or the question is high impact.

## Scalability

The stateless Next.js front end scales independently from ingestion and retrieval. Azure AI Search can partition and replicate as content and usage grow. Queue-based ingestion decouples document updates from employee traffic. Tenant, operating-company and geography metadata can support expansion without creating separate applications.
