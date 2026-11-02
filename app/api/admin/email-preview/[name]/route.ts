import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin/auth";
import { getContactInfo } from "@/lib/contact";
import * as T from "@/lib/email/templates";

// Renders an email template with sample data for the admin "Emails" page (shown in a sandboxed iframe).
const SAMPLE_ENQUIRY = {
  name: "Priya Sharma",
  email: "priya@example.com",
  phone: "+91 98765 00000",
  service: "Custom Website Development",
  budget: "₹50k – ₹1L",
  message: "Hi! We're a D2C skincare brand and need a fast Shopify store with a custom product configurator.\nCan we schedule a call this week?",
  ip: "203.0.113.24",
};

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const c = await getContactInfo();
  const builders: Record<string, () => { html: string }> = {
    "login-code": () => T.loginOtpEmail(c, { name: "Administrator", code: "482913", minutes: 10, ip: "203.0.113.24" }),
    "password-changed": () => T.passwordChangedEmail(c, { name: "Administrator", ip: "203.0.113.24" }),
    "enquiry-admin": () => T.enquiryAdminEmail(c, SAMPLE_ENQUIRY),
    "enquiry-auto-reply": () => T.enquiryAutoReply(c, SAMPLE_ENQUIRY),
    "enquiry-reply": () => T.enquiryReplyEmail(c, { name: "Priya", text: "Thanks for reaching out! Thursday 4 PM works for us.\n\nI've attached a short questionnaire so we can come prepared." }),
    "application-admin": () =>
      T.applicationAdminEmail(c, { id: 1, name: "Rahul Verma", email: "rahul@example.com", phone: "+91 90000 00000", role: "Frontend Developer", portfolio: "https://rahul.dev", linkedin: "", coverLetter: "I've shipped 12 production React apps and love performance work.", hasResume: true }),
    "application-auto-reply": () => T.applicationAutoReply(c, { name: "Rahul", role: "Frontend Developer" }),
  };
  const build = builders[(await params).name];
  if (!build) return new NextResponse("Unknown template", { status: 404 });
  return new NextResponse(build().html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src https: data:" },
  });
}
