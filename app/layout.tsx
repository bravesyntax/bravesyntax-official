import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Syne } from "next/font/google";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/config";
import "./globals.css";

const syne = Syne({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-syne" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-jetbrains-mono" });

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

// Runs before paint so the saved theme never flashes. Dark is the default.
const themeInit = `(function(){try{var m=document.cookie.match(/(?:^|; )theme=(\\w+)/);if(m&&m[1]==='light')document.documentElement.classList.remove('dark');}catch(e){}})();`;

// Document shell shared by the public site (app/(site)) and the admin panel (app/admin).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`scroll-smooth dark ${syne.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="bg-white text-gray-900 antialiased dark:bg-black dark:text-white">{children}</body>
    </html>
  );
}
