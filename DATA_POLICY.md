# Hackathon data policy

Ask Revantage must use only synthetic, anonymized, masked, scrubbed or explicitly approved non-production data.

## Prohibited

- Real employee, partner, client or vendor records
- Real policies or internal operating documents
- Production SharePoint links, exports, screenshots or copied text
- Credentials, tokens, keys, connection strings or tenant identifiers
- Personal identifiers, contact details, financial details or case information
- Production logs, analytics or ticket history

## Required practices

- Label seeded and submitted demo content as synthetic.
- Use fictional names, teams, requests, dates and metrics.
- Run `npm run data-check` before every public push and submission archive.
- Use the bundled watermarked synthetic PDF for document demonstrations; never substitute an internal policy export.
- Remove metadata from screenshots and files used in the pitch.
- Treat the public GitHub repository and Vercel site as externally visible.
- Stop and seek Security/Privacy guidance if the classification of any data is unclear.
