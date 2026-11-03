import Script from "next/script";
import Footer from "@/components/layout/Footer";
import SiteBanner from "@/components/layout/SiteBanner";
import SiteHeader from "@/components/layout/SiteHeader";
import { ScrollProgress } from "@/components/velora/scroll-progress";
import { ALL_TOOL_COUNT } from "@/lib/tools/registry";
import { getSiteSettings } from "@/lib/settings";

// Public site chrome. DB-backed content (settings, services) is cached and refreshed in the background
// every 5 minutes, and immediately after an admin edit. Next.js requires a literal here.
export const revalidate = 300;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const gaId = settings.google_analytics_id;

  return (
    <>
      <ScrollProgress className="z-60" />
      <SiteBanner count={ALL_TOOL_COUNT} />
      <SiteHeader />
      <main className="overflow-x-clip">{children}</main>
      <Footer />
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${JSON.stringify(gaId)});`}
          </Script>
        </>
      )}
    </>
  );
}
