const sensitivePatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:\+?91[\s-]?)?[6-9]\d{9}\b/,
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
  /\b[A-Z]{5}\d{4}[A-Z]\b/i,
  /\b(?:account|client secret|api key|password)\s*[:=]\s*\S+/i,
];

export function containsSensitivePattern(value: string) {
  return sensitivePatterns.some((pattern) => pattern.test(value));
}