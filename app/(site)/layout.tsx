import Footer from "@/components/layout/Footer";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { LeadTracker } from "@/components/layout/LeadTracker";
import { NewsletterPopup } from "@/components/layout/NewsletterPopup";
import { ProjectPlanner } from "@/components/planner/ProjectPlanner";
import { assistantEnabled } from "@/lib/assistant";
import { getContactInfo } from "@/lib/contact";
import { NavigationLoader } from "@/components/layout/NavigationLoader";
import SiteBanner from "@/components/layout/SiteBanner";
import SiteHeader from "@/components/layout/SiteHeader";
import { ScrollProgress } from "@/components/velora/scroll-progress";
import { ALL_TOOL_COUNT } from "@/lib/tools/registry";
import { getSiteSettings } from "@/lib/settings";

// Public site chrome. DB-backed content (settings, services) is cached; admin edits refresh the affected pages
// immediately (refreshPublicSite), so the timed refresh is only a daily safety net. Every refresh of a cached
// page is a Vercel ISR write, which the Hobby plan limits. Next.js requires a literal here.
export const revalidate = 86400;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, contact] = await Promise.all([getSiteSettings(), getContactInfo()]);
  const gaId = settings.google_analytics_id;

  return (
    <>
      <NavigationLoader />
      <LeadTracker />
      <ScrollProgress className="z-60" />
      <SiteBanner count={ALL_TOOL_COUNT} />
      <SiteHeader />
      <main className="overflow-x-clip">{children}</main>
      <Footer />
      <ProjectPlanner whatsappHref={contact.whatsappHref} assistant={assistantEnabled()} />
      <CookieConsent gaId={gaId ?? ""} />
      <NewsletterPopup />
    </>
  );
}
