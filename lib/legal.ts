import "server-only";
import type { ContactInfo } from "./contact";
import { getSiteSettings } from "./settings";

// Privacy Policy and Terms of Service. The text is edited in Admin → Legal Pages (stored in site_settings);
// until then a sensible default written from the business details is shown.

export type LegalSlug = "privacy-policy" | "terms";
export const LEGAL_PAGES: Record<LegalSlug, { key: string; updatedKey: string; title: string }> = {
  "privacy-policy": { key: "legal_privacy_html", updatedKey: "legal_privacy_updated", title: "Privacy Policy" },
  terms: { key: "legal_terms_html", updatedKey: "legal_terms_updated", title: "Terms of Service" },
};

const contactLine = (c: ContactInfo) =>
  `<a href="mailto:${c.email}">${c.email}</a>${c.phone ? ` or ${c.phone}` : ""}${c.address ? `, ${c.address}` : ""}`;

export function defaultLegalHtml(slug: LegalSlug, c: ContactInfo): string {
  if (slug === "privacy-policy") {
    return `<p>This policy explains what information ${c.siteName} ("we", "us") collects when you use our website, free online tools and services, and how we use and protect it.</p>
<h2>Information we collect</h2>
<ul>
<li><strong>Enquiries:</strong> your name, email, phone number, the service you are interested in, budget and message when you use the contact form.</li>
<li><strong>Job applications:</strong> your name, contact details, portfolio and LinkedIn links, cover letter and resume.</li>
<li><strong>Technical data:</strong> your IP address and browser details, used to prevent spam and abuse.</li>
<li><strong>Analytics:</strong> only if you choose "Accept" in the cookie notice, Google Analytics collects usage statistics through cookies. If you decline, analytics does not load. You can change your choice any time from "Cookie settings" in the footer.</li>
<li><strong>Newsletter:</strong> if you subscribe, your email address, the page you signed up on and the time you agreed. Every email has an unsubscribe link, and unsubscribing stops all newsletter emails.</li>
<li><strong>Your consent:</strong> forms that collect personal details ask you to agree first, and we record the time you agreed.</li>
<li><strong>Website assistant:</strong> questions you type into the assistant are sent to our AI provider (Google Gemini) to generate an answer. We do not store these conversations, but on the free tier Google may use them to improve its services, and people at Google may review them. Please don't include personal or confidential details.</li>
</ul>
<h2>Free PDF tools and background remover</h2>
<p>These tools run entirely in your browser. Files you open are processed on your device and are never uploaded to our servers.</p>
<h2>How we use your information</h2>
<ul>
<li>To reply to your enquiry and prepare proposals.</li>
<li>To review job applications and contact candidates.</li>
<li>To keep the website secure and free of spam.</li>
</ul>
<p>We do not sell or rent your personal information. We share it only with service providers that help us run the website (hosting, email delivery, storage), under confidentiality obligations.</p>
<h2>How long we keep it</h2>
<p>Enquiries are kept for as long as needed to handle your request and any resulting project. Unsuccessful job applications are deleted within 12 months. You can ask us to delete your data at any time.</p>
<h2>Your rights</h2>
<p>You can request a copy of your data, ask us to correct or delete it, or withdraw consent for future contact. Write to us and we will respond within 30 days.</p>
<h2>Contact</h2>
<p>Questions about this policy: ${contactLine(c)}.</p>`;
  }
  return `<p>These terms apply to your use of the ${c.siteName} website, our free online tools and our design and development services. By using the website you agree to them.</p>
<h2>Use of the website and free tools</h2>
<p>The website and free tools are provided "as is" without warranties. Use them lawfully and only with files and content you have the right to process. We may change or discontinue any tool at any time.</p>
<h2>Projects and services</h2>
<ul>
<li>Every project is governed by a written proposal or quote that sets out scope, price, timeline and milestones.</li>
<li>Work outside the agreed scope is quoted separately before it starts.</li>
<li>Payments are due as set out in the proposal. Work may pause while invoices are overdue.</li>
</ul>
<h2>Ownership</h2>
<p>Once a project is paid in full, you own the final deliverables and source files created for you. Third-party assets (fonts, plugins, stock media, platforms) remain subject to their own licences. We may show completed work in our portfolio unless you ask us not to.</p>
<h2>Liability</h2>
<p>We take care to deliver reliable work but are not liable for indirect losses such as lost profits or data. Our total liability for any project is limited to the amount paid for it.</p>
<h2>Changes</h2>
<p>We may update these terms. The date at the top shows the latest version.</p>
<h2>Contact</h2>
<p>Questions about these terms: ${contactLine(c)}.</p>`;
}

export async function getLegalPage(slug: LegalSlug, c: ContactInfo) {
  const s = await getSiteSettings();
  const def = LEGAL_PAGES[slug];
  return { title: def.title, html: s[def.key] || defaultLegalHtml(slug, c), updated: s[def.updatedKey] || "", isDefault: !s[def.key] };
}
