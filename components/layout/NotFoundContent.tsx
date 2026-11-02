import Link from "next/link";
import { CtaLink } from "@/components/site/ui";
import { HyperText } from "@/components/velora/hyper-text";
import { Lamp } from "@/components/velora/lamp";

// Shared 404 body, used by app/not-found.tsx, app/(site)/not-found.tsx and the 410 page.
export default function NotFoundContent() {
  return (
    <Lamp className="min-h-[70vh]">
      <div className="px-6 text-center">
        <HyperText className="font-mono text-sm tracking-widest text-primary uppercase">Error 404</HyperText>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">Page not found</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist, may have been moved, or the link is out of date.</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <CtaLink href="/">Back to home</CtaLink>
          <CtaLink href="/contact" variant="outline" arrow={false}>
            Contact us
          </CtaLink>
        </div>
        <nav className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm" aria-label="Popular pages">
          {[
            ["Services", "/services"],
            ["Work", "/portfolio"],
            ["About", "/about"],
            ["Blog", "/blog"],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="text-muted-foreground transition-colors hover:text-foreground">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </Lamp>
  );
}
