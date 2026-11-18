# Responsible AI notes

## Intended use

Ask Revantage helps employees find routine workplace information and route unresolved questions. It is not an authority for legal, employment, tax, safety, security-incident, medical or financial decisions.

## Current demo

The current answer endpoint is deterministic keyword retrieval over synthetic samples. It does not call a foundation model. The interface intentionally demonstrates citations, confidence and escalation so these controls are part of the product experience before generative AI is introduced.

## Production requirements

- Ground answers only in sources the user is authorized to access.
- Show citations and source freshness.
- Refuse or escalate when retrieval confidence is low.
- Evaluate groundedness, relevance, bias, prompt injection and privacy leakage.
- Add input/output filtering and abuse monitoring.
- Keep a human owner for content and a human path for employee support.
- Publish clear feedback, correction and incident-response processes.
- Do not use employee prompts or feedback for model training without explicit approval.
