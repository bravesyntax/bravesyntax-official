import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/config";
import "./globals.css";


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} | ${SITE_TAGLINE}`, template: `%s | ${SITE_NAME}` },
  authors: [{ name: SITE_NAME }],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// Runs before paint so the saved theme never flashes. Light is the default.
const themeInit = `(function(){try{var m=document.cookie.match(/(?:^|; )theme=(\\w+)/);if(m&&m[1]==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

// Document shell shared by the public site (app/(site)) and the admin panel (app/admin).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`scroll-smooth ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
