/**
 * Build a job title + description for the wholesale applicant review use case.
 * Returns { title, description } — domain-specific, not part of the SDK.
 */
export function buildPrompt(formData) {
  const name = `${formData.firstName ?? ''} ${formData.lastName ?? ''}`.trim();

  const facts = [
    `Name: ${formData.firstName ?? ''} ${formData.lastName ?? ''}`.trim(),
    `Email: ${formData.email ?? '\u2014'}`,
    `Company: ${formData.companyName ?? '\u2014'}`,
    `Tax ID/ABN/VAT: ${formData.taxId ?? '\u2014'}`,
    `Phone: ${formData.phone ?? '\u2014'}`,
    `Website: ${formData.website ?? '\u2014'}`,
    `About: ${formData.about ?? '\u2014'}`,
    `Shipping: ${[formData.addressLine1, formData.addressLine2, formData.city, formData.state, formData.zip, formData.country].filter(Boolean).join(', ')}`,
  ].join('\n');

  const description = [
    'You are reviewing a wholesale-account application. Produce an AI customer-intelligence report and return ONLY valid JSON (no prose, no markdown) matching this TypeScript type:',
    '',
    'type Report = {',
    "  headline: string;           // e.g. 'Name \u2014 City, Country | Industry'",
    '  summary: string;            // 2-3 sentences',
    "  verification: string[];     // bullet lines e.g. 'Tax ID: Not provided \u2014 request before approval.'",
    '  confidence: string[];       // bullet lines: Website/Instagram/Public listing/Email signals',
    "  recommendation: { level: 'APPROVE' | 'REVIEW' | 'REJECT'; note: string };",
    '};',
    '',
    'Applicant data:',
    facts,
  ].join('\n');

  const title = name.length < 5
    ? `${name} (wholesale applicant)`.trim()
    : `Wholesale applicant review: ${name}`.slice(0, 200);

  return { title, description };
}
