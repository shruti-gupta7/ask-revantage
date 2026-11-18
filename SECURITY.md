# Security policy

This is a non-production hackathon prototype.

## Reporting

Do not include a real vulnerability, credential or confidential record in a public issue. Follow the organization’s approved private security-reporting process.

## Built-in demo controls

- No production data connector
- API input checks for common personal and secret patterns
- Mandatory synthetic-data confirmation when adding a source
- Security response headers
- `.env` and Vercel metadata excluded from Git
- CI data-safety, type, lint and build checks
- Low-confidence escalation instead of fabricated answers

## Before production

Complete threat modeling, secure code review, SAST/dependency scanning, penetration testing, privacy impact assessment, identity/authorization design, logging/monitoring design and an incident-response plan. Replace in-memory storage and do not reuse demo secrets or data.
