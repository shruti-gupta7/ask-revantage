# Ask Revantage

Ask Revantage is a hackathon-ready employee knowledge experience that turns scattered workplace information into clear, source-linked answers. When the demo cannot answer confidently, it classifies the question and creates a trackable request for a support team instead of guessing.

> **Data safety:** this repository contains synthetic demo data only. Do not add real, confidential, personal, production, or client information.

## Why this matters

Employees often lose time searching across policy libraries, service pages, PDFs and support channels. Ask Revantage provides one front door for People, cab/travel, workplace, technology and finance questions while preserving a human escalation path.

## Functional scope

- Premium Revantage-branded user and admin workspaces
- Source-grounded Q&A with confidence and citation cards
- Knowledge hub with status and ownership metadata
- Request classification and routing when an answer is uncertain
- Admin source connection workflow with a mandatory synthetic-data confirmation
- Operational queue and analytics views
- Next.js API routes for Q&A, source management, requests and health checks
- Sensitive-pattern blocking and an automated repository data-safety check
- Microsoft-first target architecture: Entra ID, SharePoint/Microsoft Graph, Azure AI Search and Azure OpenAI
- Optional server-side Copilot Studio agent adapter with an explicit demo fallback
- Bundled three-page synthetic HR-policy PDF for safe ingestion and citation demonstrations

## Tech stack

- Next.js 16 App Router, React 19 and TypeScript
- Tailwind CSS 4 with Revantage design tokens
- Next.js route handlers as a replaceable demo backend adapter
- GitHub Actions for data safety, types, lint and production build
- Vercel-ready configuration

## Microsoft and build-tool story

| Tool | Role in Ask Revantage |
|---|---|
| Microsoft Copilot | Assisted ideation, UX refinement, coding, documentation and test planning; disclosed below and in `AI_DISCLOSURE.md` |
| Microsoft Copilot Studio | Target AI-agent orchestration option; the repository includes a secure server-side adapter contract and uses the deterministic demo provider by default |
| SharePoint and OneDrive | Realistic future source types for permission-aware knowledge ingestion; no production tenant is connected in this hackathon build |
| Microsoft Excel | Represented as a realistic structured source type using synthetic metadata only |
| Microsoft Entra ID | Target authentication and role-based access layer for a production pilot |
| Azure AI Search / Azure OpenAI | Documented production retrieval and grounded-generation path, subject to approval and responsible-AI controls |
| Git and GitHub | Version control, public source-code delivery and GitHub Actions verification |
| Next.js, React, TypeScript and Tailwind CSS | Functional full-stack application and premium responsive interface |
| Vercel | Chosen Next.js deployment target for the public demo |

The running hackathon demo does **not** call Copilot Studio, SharePoint, OneDrive, Excel, Microsoft Graph, Azure OpenAI or another production service unless an approved server-side test adapter is explicitly configured. This distinction keeps the demo honest and data-safe.

## Synthetic sample document

The Knowledge Hub includes [`public/demo-data/synthetic-hr-policy.pdf`](public/demo-data/synthetic-hr-policy.pdf), a three-page fictional HR-policy-format document. It is visibly watermarked, repeatedly labeled synthetic, and contains no real Revantage policy or employee information. Regenerate it with:

```bash
python -m pip install -r requirements-docs.txt
python scripts/generate-synthetic-hr-policy.py
```

## Run locally

Prerequisites: Node.js 20.9+ (Node 22 LTS recommended), npm and Git.

```bash
git clone <YOUR_PUBLIC_REPOSITORY_URL>
cd ask-revantage
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. The demo adapter needs no environment variables.

Verify the submission before publishing:

```bash
npm run verify
```

## Deploy to Vercel

1. Push this repository to a **public GitHub repository**.
2. Sign in to Vercel and choose **Add New → Project**.
3. Import the GitHub repository. Vercel detects Next.js automatically.
4. Keep the build command as `npm run build` and deploy.
5. For the demo, do not add production credentials. If a later approved environment connects Microsoft services, add secrets only in Vercel project settings and follow company security review.

The in-memory demo adapter resets when a serverless instance restarts. This is intentional for a safe hackathon demonstration. See [Architecture](docs/ARCHITECTURE.md) for the production path.

### Optional Copilot Studio agent

An approved server-side broker can connect the application to a Copilot Studio agent without exposing credentials to the browser. Set `AI_PROVIDER=copilot-studio`, `COPILOT_STUDIO_AGENT_ENDPOINT` and `COPILOT_STUDIO_AGENT_TOKEN` in an approved non-production environment. The broker must accept `{ question, context }` and return `{ answer, confidence, team, sources }`. Keep the default `AI_PROVIDER=demo` for public judging.

## Submission package

Create the HackerEarth archive after verification:

```bash
npm run verify
cd ..
tar --exclude='ask-revantage/node_modules' --exclude='ask-revantage/.next' --exclude='ask-revantage/.git' -czf ask-revantage-hackathon.tar.gz ask-revantage
# or: zip -r ask-revantage-hackathon.zip ask-revantage -x 'ask-revantage/node_modules/*' 'ask-revantage/.next/*' 'ask-revantage/.git/*'
```

Include the public GitHub URL, deployed Vercel URL, [pitch script](docs/PITCH_SCRIPT.md), [AI disclosure](AI_DISCLOSURE.md), and run instructions in the HackerEarth entry.

## Responsible AI and data use

- All seeded policies, people, requests, metrics and answers are fictional and explicitly labeled as synthetic samples.
- The demo does not connect to SharePoint, Microsoft Graph, HR systems or any production source.
- The answer service uses deterministic keyword matching; production generative AI is a documented future adapter, not an undisclosed live dependency.
- Potential emails, Indian mobile numbers, identification numbers and populated secrets are blocked by API guardrails.
- High-impact decisions must be verified against an authoritative production source and remain subject to human review.

Read [DATA_POLICY.md](DATA_POLICY.md), [RESPONSIBLE_AI.md](RESPONSIBLE_AI.md), and [SECURITY.md](SECURITY.md) before changing the demo.

## AI disclosure

Microsoft Copilot assisted with product design, code generation, documentation and test planning. The implementation was reviewed and adapted for the hackathon’s synthetic-data, security, privacy and responsible-AI requirements. Full details are in [AI_DISCLOSURE.md](AI_DISCLOSURE.md).

## Brand choices

The UI uses the approved Revantage Navy, Bronze, Light Blue, Medium Blue, Tan and Light Gray palette. Teal and Pale Blue are used only because this is an internal application. Genath and Untitled Sans were not available, so the approved fallbacks are used: Georgia for headings and Arial for body/UI text. The supplied logo artwork is preserved without recoloring or distortion.

## License and marks

Source code is available under the [MIT License](LICENSE) for hackathon judging, subject to applicable corporate policies. Revantage names, marks and supplied artwork are not granted under the MIT license; see [NOTICE.md](NOTICE.md).
