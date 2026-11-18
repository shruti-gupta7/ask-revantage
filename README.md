# Ask Revantage

**One question. One place. One answer.**

Ask Revantage is a Next.js employee knowledge experience for finding workplace information, checking the source, and reaching the right support route when an answer is not available. The current build includes a searchable policy library, policy-grounded responses, local request tracking, named routing contacts with local avatars, and a server-side connection point for a Microsoft Copilot Studio agent.

## What is included

- Premium Revantage-aligned interface using Navy, Bronze, Light Blue, Medium Blue, Tan, and Light Gray
- Accessible glassmorphism surface system with layered translucency, 20px backdrop blur, refraction edges, and solid-color fallbacks
- Tasteful staged reveal animations with automatic reduced-motion support
- Ask Revantage logo stored in `public/assets/ask-revantage-logo.jpeg`
- Route-specific metadata for the home, knowledge, support, and admin pages, including canonical links and Open Graph/Twitter cards
- Generated favicon, Apple touch icon, web app manifest, and branded Open Graph image
- Five sample policy documents covering:
  - People and leave
  - Cab and late-night transport
  - Travel and expenses
  - IT access and security
  - Workplace and facilities
- Policy matching with source title, section, version, and document link
- Exactly three suggested prompt pills on the homepage
- Supporting source-document card inside each policy answer, with open-in-new-tab and download actions
- Named support routes and illustrated picture avatars
- Request creation and browser-based request history
- Knowledge, routing, and admin views
- Microsoft Copilot Studio integration through Direct Line, with a policy-library fallback
- Responsive design for desktop, tablet, and mobile

## Application routes and metadata

Each main experience has a real Next.js route and dedicated metadata:

| Route | Page | Metadata purpose |
|---|---|---|
| `/` | Ask Revantage | Employee policy assistant and trusted-answer experience |
| `/knowledge` | Knowledge library | Available policy sources and approved answer sections |
| `/support` | Support routes | Named department contacts and escalation experience |
| `/admin` | Admin overview | Knowledge coverage, AI readiness, and routed requests |

Set `NEXT_PUBLIC_SITE_URL` in Vercel to the production domain so canonical and social metadata resolve to the final deployment URL.

## Microsoft and development tools

This hackathon solution was shaped with Microsoft Copilot for research, planning, content refinement, and coding support. The conversational integration is designed for Microsoft Copilot Studio. The production direction can use Microsoft 365 sources such as SharePoint, OneDrive, Excel, and approved document libraries. GitHub provides source control, GitHub Codespaces supports browser-based development, and Vercel builds and hosts the Next.js application.

## Run locally or in GitHub Codespaces

Requirements: Node.js 20.9 or later.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For a production check:

```bash
npm run typecheck
npm run build
npm start
```

## Connect the Copilot Studio agent

The app answers known policy questions from the local document library first. Questions without a confident match are sent to Copilot Studio when a server-side connection is configured. If the agent is unavailable, the app shows the best human support route.

For a matched policy answer, the chat response includes the supporting document title, matching section, category, version, owner, effective date, and summary. Users can open the source in a new browser tab or download the document directly from the response.

1. Publish the agent in Microsoft Copilot Studio.
2. Open **Channels** and configure the **Mobile app** or Direct Line channel.
3. Copy the token endpoint or Direct Line secret.
4. In Vercel, open **Project settings → Environment Variables**.
5. Add one of the following:

```text
COPILOT_STUDIO_TOKEN_ENDPOINT=<token endpoint from Copilot Studio>
```

or

```text
COPILOT_STUDIO_DIRECT_LINE_SECRET=<server-side secret>
```

Optional:

```text
COPILOT_STUDIO_DIRECT_LINE_BASE_URL=https://directline.botframework.com
```

6. Redeploy the latest commit.

Never place the Direct Line secret in a variable prefixed with `NEXT_PUBLIC_`, and never commit credentials to GitHub.

## Policy content

The documents in `public/documents/` contain hackathon sample content and do not represent official Revantage policy. The connector types and workflow are designed to demonstrate how approved SharePoint, OneDrive, Excel, and document-library sources can be added later.

To add a policy:

1. Add the source document under `public/documents/`.
2. Add its metadata and approved answer sections to `data/knowledge.ts`.
3. Confirm the relevant keywords and support route.
4. Run the build and test at least one matched and one unmatched question.

## Repository update workflow

When local developer tools are restricted:

1. Download the updated project ZIP.
2. Open the GitHub repository in Codespaces.
3. Upload the project contents at the repository root so `app/`, `data/`, `public/`, and `package.json` are siblings.
4. Run `npm install`, `npm run typecheck`, and `npm run build`.
5. Commit and push to `main`.
6. Let Vercel deploy the new commit automatically.

## Brand implementation

The interface uses Georgia for display headings and Arial for body/UI copy because the licensed Genath and Untitled Sans font files are not included in the repository. The supplied logo is used without recoloring or stretching.

The visual system takes implementation cues from the Hype4 Glassmorphism Generator: translucent surfaces, a 20px backdrop blur, bright refraction edges, restrained depth shadows, and layered branded backgrounds. Readability remains the priority, so content surfaces use high-opacity white or Navy treatments, focus states remain visible, browsers without backdrop-filter support receive solid fallbacks, and reveal animations are disabled when a user prefers reduced motion.
