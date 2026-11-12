import Link from "next/link";
import { CtaLink } from "@/components/site/ui";
import { HyperText } from "@/components/velora/hyper-text";
import { Lamp } from "@/components/velora/lamp";

type Props = {
  eyebrow?: string;
  title?: string;
  text?: string;
  cta?: [label: string, href: string];
  secondary?: [label: string, href: string];
};

// Shared 404 body, used by app/not-found.tsx, app/(site)/not-found.tsx and the 410 page (which passes its own text
// for removed city pages).
export default function NotFoundContent({
  eyebrow = "Error 404",
  title = "Page not found",
  text = "The page you're looking for doesn't exist, may have been moved, or the link is out of date.",
  cta = ["Back to home", "/"],
  secondary = ["Contact us", "/contact"],
}: Props) {
  return (
    <Lamp className="min-h-[70vh]">
      <div className="px-6 text-center">
        <HyperText className="font-mono text-sm tracking-widest text-primary uppercase">{eyebrow}</HyperText>
        <h1 className="mx-auto mt-4 max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">{text}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <CtaLink href={cta[1]}>{cta[0]}</CtaLink>
          <CtaLink href={secondary[1]} variant="outline" arrow={false}>
            {secondary[0]}
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
