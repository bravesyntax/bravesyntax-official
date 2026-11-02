"use client";

import { ArrowRight, ChevronDown, Code2, FileText, Layers, Mail, Menu, MessageCircle, Palette, Phone, Search, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggler } from "@/components/velora/theme-toggler";
import { NAV_LINKS, PDF_TOOL_COUNT, PDF_TOOLS, serviceHref, type NavService } from "@/lib/navigation";
import SearchPalette, { type SearchDoc } from "./SearchPalette";

export type HeaderContact = { email: string; phone: string; phoneHref: string; whatsappHref: string };

const linkClass =
  "rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function setThemeCookie(dark: boolean) {
  document.cookie = `theme=${dark ? "dark" : "light"};path=/;max-age=31536000;SameSite=Lax`;
}

export default function Header({ services = [], contact, searchDocs = [] }: { services?: NavService[]; contact?: HeaderContact; searchDocs?: SearchDoc[] }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  useEffect(() => setIsDark(document.documentElement.classList.contains("dark")), []);

  const toggleTheme = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    setThemeCookie(next);
    setIsDark(next);
  };

  const design = services.filter((s) => s.category === "design");
  const development = services.filter((s) => s.category !== "design");
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Brave Syntax home" className="flex shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Logo className="h-6 sm:h-7" priority />
          </Link>

          <ul className="ml-4 hidden items-center gap-0.5 lg:flex">
            <li>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={`group/menu inline-flex items-center gap-1 whitespace-nowrap data-[state=open]:bg-muted data-[state=open]:text-foreground ${linkClass}`}>
                    Services
                    <ChevronDown aria-hidden="true" className="size-3.5 transition-transform duration-200 group-data-[state=open]/menu:rotate-180 motion-reduce:transition-none" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={14} className="w-[46rem] max-w-(--radix-dropdown-menu-content-available-width) rounded-2xl p-2 shadow-xl shadow-foreground/5">
                  <div className="grid grid-cols-[1fr_1fr_13rem] gap-2">
                    {[
                      ["Design", design, Palette] as const,
                      ["Development", development, Code2] as const,
                    ].map(([label, list, Icon]) => (
                      <div key={label}>
                        <DropdownMenuLabel className="flex items-center gap-2 px-2.5 pt-2 pb-1">
                          <Icon className="size-3.5 text-primary" aria-hidden="true" /> {label}
                        </DropdownMenuLabel>
                        {list.map((s) => (
                          <DropdownMenuItem key={s.title} asChild className="rounded-lg px-2.5 py-2">
                            <Link href={serviceHref(s)}>{s.title}</Link>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ))}
                    <div className="relative flex flex-col overflow-hidden rounded-xl border bg-linear-to-br from-brand-from/15 via-brand-via/5 to-brand-to/15 p-4">
                      <Layers className="size-5 text-primary" aria-hidden="true" />
                      <p className="mt-3 font-medium">Not sure what you need?</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Tell us the problem. We&apos;ll suggest the simplest way to solve it, with a fixed quote.</p>
                      <DropdownMenuItem asChild className="-mx-1.5 mt-auto rounded-lg px-1.5 pt-3 font-medium text-primary">
                        <Link href="/contact">
                          Talk to us <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      </DropdownMenuItem>
                    </div>
                  </div>
                  <div className="mt-1 border-t px-2.5 pt-2 pb-1">
                    <DropdownMenuItem asChild className="rounded-lg text-sm font-medium">
                      <Link href="/services">
                        All services and pricing <ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
            <li>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={`group/menu inline-flex items-center gap-1 whitespace-nowrap data-[state=open]:bg-muted data-[state=open]:text-foreground ${linkClass}`}>
                    Free Tools
                    <ChevronDown aria-hidden="true" className="size-3.5 transition-transform duration-200 group-data-[state=open]/menu:rotate-180 motion-reduce:transition-none" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" sideOffset={14} className="w-80 rounded-2xl p-2 shadow-xl shadow-foreground/5">
                  <DropdownMenuItem asChild className="items-start gap-3 rounded-xl p-2.5">
                    <Link href="/bg-remover">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg border bg-background text-primary shadow-xs">
                        <Wand2 className="size-4" aria-hidden="true" />
                      </span>
                      <span className="grid gap-0.5">
                        <span className="font-medium text-foreground">AI Background Remover</span>
                        <span className="text-xs leading-snug text-muted-foreground">Transparent PNG in your browser</span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="items-start gap-3 rounded-xl p-2.5">
                    <Link href="/pdf-tools">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg border bg-background text-primary shadow-xs">
                        <FileText className="size-4" aria-hidden="true" />
                      </span>
                      <span className="grid gap-0.5">
                        <span className="font-medium text-foreground">All {PDF_TOOL_COUNT} PDF tools</span>
                        <span className="text-xs leading-snug text-muted-foreground">Merge, split, compress, sign and more</span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuLabel className="px-2.5 pt-3 pb-1">Popular</DropdownMenuLabel>
                  <div className="grid grid-cols-2">
                    {PDF_TOOLS.slice(0, 6).map((t) => (
                      <DropdownMenuItem key={t.slug} asChild className="rounded-lg px-2.5 py-1.5 text-sm">
                        <Link href={`/pdf-tools?tool=${t.slug}`}>{t.name}</Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={isActive(l.href) ? "page" : undefined} className={`block ${linkClass} ${isActive(l.href) ? "bg-muted text-foreground" : ""}`}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={() => setSearchOpen(true)} className="hidden h-9 w-44 justify-start gap-2 rounded-lg px-3 font-normal text-muted-foreground xl:inline-flex">
              <Search aria-hidden="true" />
              Search…
              <kbd aria-hidden="true" className="ml-auto rounded border bg-muted px-1.5 font-mono text-[0.7rem] text-muted-foreground">
                Ctrl K
              </kbd>
            </Button>
            <Button variant="ghost" size="icon-lg" aria-label="Search" onClick={() => setSearchOpen(true)} className="xl:hidden">
              <Search aria-hidden="true" />
            </Button>
            <ThemeToggler isDark={isDark} onToggle={toggleTheme} className="hidden sm:grid" />
            <Button asChild className="hidden h-9 rounded-full px-4 sm:inline-flex">
              <Link href="/contact">Get a quote</Link>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon-lg" aria-label="Open menu" className="lg:hidden">
                  <Menu aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-sm">
                <SheetHeader className="border-b px-5 py-4">
                  <SheetTitle>
                    <Logo className="h-6" />
                  </SheetTitle>
                  <SheetDescription className="sr-only">Site navigation</SheetDescription>
                </SheetHeader>
                <nav aria-label="Mobile" className="flex-1 px-3 py-3">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="services" className="border-b-0">
                      <AccordionTrigger className="rounded-lg px-2 py-3 text-base hover:bg-muted hover:no-underline">Services</AccordionTrigger>
                      <AccordionContent className="pb-2 [&_a]:no-underline">
                        <ul className="grid gap-0.5 pl-2">
                          {services.map((s) => (
                            <li key={s.title}>
                              <SheetClose asChild>
                                <Link href={serviceHref(s)} className="block rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                                  {s.title}
                                </Link>
                              </SheetClose>
                            </li>
                          ))}
                          <li>
                            <SheetClose asChild>
                              <Link href="/services" className="block rounded-lg px-2 py-2 text-sm font-medium text-primary hover:bg-muted">
                                All services and pricing
                              </Link>
                            </SheetClose>
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="tools" className="border-b-0">
                      <AccordionTrigger className="rounded-lg px-2 py-3 text-base hover:bg-muted hover:no-underline">Free Tools</AccordionTrigger>
                      <AccordionContent className="pb-2 [&_a]:no-underline">
                        <ul className="grid gap-0.5 pl-2">
                          <li>
                            <SheetClose asChild>
                              <Link href="/bg-remover" className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                                <Sparkles className="size-4 text-primary" aria-hidden="true" /> AI Background Remover
                              </Link>
                            </SheetClose>
                          </li>
                          <li>
                            <SheetClose asChild>
                              <Link href="/pdf-tools" className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                                <FileText className="size-4 text-primary" aria-hidden="true" /> All {PDF_TOOL_COUNT} PDF tools
                              </Link>
                            </SheetClose>
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <ul>
                    {NAV_LINKS.map((l) => (
                      <li key={l.href}>
                        <SheetClose asChild>
                          <Link href={l.href} className="block rounded-lg px-2 py-3 text-base font-medium hover:bg-muted">
                            {l.label}
                          </Link>
                        </SheetClose>
                      </li>
                    ))}
                    <li>
                      <SheetClose asChild>
                        <Link href="/contact" className="block rounded-lg px-2 py-3 text-base font-medium hover:bg-muted">
                          Contact
                        </Link>
                      </SheetClose>
                    </li>
                  </ul>
                </nav>
                <div className="grid gap-2 border-t px-5 py-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    Theme <ThemeToggler isDark={isDark} onToggle={toggleTheme} />
                  </div>
                  {contact?.whatsappHref && (
                    <Button asChild variant="outline" className="h-11 rounded-full">
                      <a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer">
                        <MessageCircle aria-hidden="true" /> WhatsApp us
                      </a>
                    </Button>
                  )}
                  {contact?.phoneHref ? (
                    <Button asChild variant="outline" className="h-11 rounded-full">
                      <a href={contact.phoneHref}>
                        <Phone aria-hidden="true" /> {contact.phone}
                      </a>
                    </Button>
                  ) : (
                    contact?.email && (
                      <Button asChild variant="outline" className="h-11 rounded-full">
                        <a href={`mailto:${contact.email}`}>
                          <Mail aria-hidden="true" /> {contact.email}
                        </a>
                      </Button>
                    )
                  )}
                  <SheetClose asChild>
                    <Button asChild className="h-11 rounded-full">
                      <Link href="/contact">Get a quote</Link>
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>
      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} services={services} docs={searchDocs} />
    </>
  );
}
