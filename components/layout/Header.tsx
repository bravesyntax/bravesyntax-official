"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Briefcase, Building2, GraduationCap, Home, Layers, Mail, Menu, MessageCircle, Moon, Newspaper, Phone, Sun, Users, Wrench, X } from "lucide-react";
import { NAV_LINKS, PDF_TOOL_GROUPS, contactServiceHref, groupNavServices, type NavService } from "@/lib/navigation";
import Logo from "@/components/Logo";
import SearchPalette, { type SearchDoc } from "./SearchPalette";

type MegaKey = "tools" | "services";

const NAV_BASE = "text-[10px] py-1 font-mono font-normal tracking-[0.15em] uppercase transition-colors";
const NAV_IDLE = "text-gray-700 dark:text-gray-300 hover:text-accent";
const NAV_ACTIVE = "text-accent";

const SCROLL_THRESHOLD = 50;
const SCROLL_FLIP_DISTANCE = 40;

const Chevron = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ArrowRight = ({ size }: { size: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

function toggleTheme() {
  const html = document.documentElement;
  const dark = !html.classList.contains("dark");
  html.classList.toggle("dark", dark);
  document.cookie = `theme=${dark ? "dark" : "light"};path=/;max-age=31536000;SameSite=Lax`;
}

export type HeaderContact = { email: string; phone: string; phoneHref: string; whatsappHref: string };

const DRAWER_ICONS: Record<string, typeof Home> = { "/industries": Building2, "/about": Users, "/portfolio": Briefcase, "/blog": Newspaper, "/careers": GraduationCap };

export default function Header({ services = [], contact, searchDocs = [] }: { services?: NavService[]; contact?: HeaderContact; searchDocs?: SearchDoc[] }) {
  const pathname = usePathname();
  const serviceGroups = groupNavServices(services);
  const [activeMega, setActiveMega] = useState<MegaKey | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openAcc, setOpenAcc] = useState<Record<string, boolean>>({});
  const [scrolled, setScrolled] = useState(false);
  const [row1Hidden, setRow1Hidden] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const navRef = useRef<HTMLElement>(null);

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);
  const toolsActive = isActive("/pdf-tools") || isActive("/bg-remover");

  // ── Mega menu: hover intent + click toggle ──
  const megaOpen = (key: MegaKey) => {
    clearTimeout(closeTimer.current);
    setActiveMega(key);
  };
  const megaCloseAll = useCallback(() => setActiveMega(null), []);
  const megaToggle = (key: MegaKey) => {
    clearTimeout(closeTimer.current);
    setActiveMega((cur) => (cur === key ? null : key));
  };
  const megaScheduleClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(megaCloseAll, 200);
  };
  const megaCancelClose = () => clearTimeout(closeTimer.current);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleAcc = (id: string) => setOpenAcc((s) => ({ ...s, [id]: !s[id] }));

  // Close menus on navigation
  useEffect(() => {
    setActiveMega(null);
    setDrawerOpen(false);
  }, [pathname]);

  // Lock page scroll while the drawer is open
  useEffect(() => {
    document.documentElement.style.overflow = drawerOpen ? "hidden" : "";
    // Lets page-level fixed bars (e.g. the home sticky CTA) step aside while the menu is open.
    document.documentElement.classList.toggle("bs-menu-open", drawerOpen);
  }, [drawerOpen]);

  // Outside click, Escape, resize-to-desktop
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) megaCloseAll();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        megaCloseAll();
        closeDrawer();
      }
    };
    const onResize = () => {
      if (window.innerWidth >= 1024) closeDrawer();
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [megaCloseAll, closeDrawer]);

  // Scroll: collapse the top row when scrolling down, restore when scrolling up
  useEffect(() => {
    let anchorY = 0;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      setScrolled(y > SCROLL_THRESHOLD);
      if (y <= SCROLL_THRESHOLD) {
        setRow1Hidden(false);
        anchorY = y;
      } else if (y - anchorY > SCROLL_FLIP_DISTANCE) {
        setRow1Hidden(true);
        megaCloseAll();
        anchorY = y;
      } else if (anchorY - y > SCROLL_FLIP_DISTANCE) {
        setRow1Hidden(false);
        anchorY = y;
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, [megaCloseAll]);

  const navClasses = ["fixed top-0 left-0 right-0 z-50", scrolled && "bs-scrolled", row1Hidden && "bs-row1-hidden"]
    .filter(Boolean)
    .join(" ");

  const drawerLink = (active: boolean) =>
    `flex items-center gap-3 px-3 py-3 rounded-xl font-display text-[15px] font-semibold ${active ? "text-accent bg-accent/5" : "text-gray-900 dark:text-gray-100"} hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors`;
  const drawerAccBtn = (active: boolean) =>
    `flex w-full items-center justify-between px-3 py-3 rounded-xl font-display text-[15px] font-semibold ${active ? "text-accent" : "text-gray-900 dark:text-gray-100"} hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors`;
  const drawerSubLink =
    "block px-3 py-2 rounded-lg font-mono text-[13px] text-gray-600 dark:text-gray-400 hover:text-accent hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors";

  return (
    <>
      <nav id="bs-nav" ref={navRef} className={navClasses}>
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          {/* Row 1: Theme (left) · Logo (center) · Search + CTA / Hamburger (right) */}
          <div className="bs-nav-top flex items-center justify-between gap-3 lg:grid lg:grid-cols-3">
            <div className="hidden lg:flex items-center justify-self-start">
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-accent rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                title="Toggle theme"
                aria-label="Toggle light/dark mode"
              >
                <svg className="w-[18px] h-[18px] hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <svg className="w-[18px] h-[18px] block dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>
            </div>

            <Link href="/" className="flex items-center lg:justify-center lg:justify-self-center min-w-0" aria-label="Brave Syntax — Home">
              <Logo className="h-6 sm:h-7 lg:h-8" priority />
            </Link>

            <div className="flex flex-shrink-0 items-center justify-self-end gap-0.5 sm:gap-1">
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                title="Search (Ctrl+K)"
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <Link
                href="/contact"
                className="hidden lg:inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 dark:bg-gray-50 text-gray-50 dark:text-gray-900 border border-gray-900 dark:border-gray-50 font-mono text-xs font-semibold px-5 py-2 hover:opacity-90 transition-opacity ml-1"
              >
                Get Started
              </Link>
              <button
                onClick={toggleTheme}
                className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-accent rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                aria-label="Toggle light/dark mode"
              >
                <Sun className="w-[18px] h-[18px] hidden dark:block" aria-hidden="true" />
                <Moon className="w-[18px] h-[18px] block dark:hidden" aria-hidden="true" />
              </button>
              <button
                onClick={() => setDrawerOpen((o) => !o)}
                className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                aria-label={drawerOpen ? "Close menu" : "Open menu"}
                aria-expanded={drawerOpen}
                aria-controls="bs-mobile-nav"
              >
                {drawerOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Row 2: centered navigation links (desktop) */}
          <div className="hidden lg:flex items-center justify-center gap-5 py-2" onMouseLeave={megaScheduleClose}>
            {(
              [
                ["tools", "Tools", toolsActive],
                ["services", "Services", isActive("/services")],
              ] as const
            ).map(([key, label, active]) => (
              <div
                key={key}
                className={`bs-mega-wrap inline-flex${activeMega === key ? " bs-mega-open" : ""}`}
                onMouseEnter={() => megaOpen(key)}
              >
                <button
                  className={`bs-nav-link-btn ${NAV_BASE} ${active ? NAV_ACTIVE : NAV_IDLE}`}
                  onClick={() => megaToggle(key)}
                  aria-expanded={activeMega === key}
                  aria-controls={`bs-mega-${key}`}
                >
                  {label}
                  <Chevron className="bs-nav-chevron" />
                </button>
              </div>
            ))}

            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onMouseEnter={megaCloseAll}
                className={`${NAV_BASE} ${isActive(l.href) ? NAV_ACTIVE : NAV_IDLE}`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ═══ MEGA PANEL — TOOLS ═══ */}
        <div
          id="bs-mega-tools"
          className={`bs-mega-panel${activeMega === "tools" ? " bs-mega-open" : ""}`}
          role="region"
          aria-label="Tools menu"
          onMouseEnter={megaCancelClose}
          onMouseLeave={megaScheduleClose}
        >
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10">
            <div className="grid grid-cols-12 gap-10">
              <div className="mega-col col-span-3 pr-8">
                <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-gray-400 dark:text-gray-500 uppercase mb-4">Featured</p>
                <Link href="/bg-remover" className="group block">
                  <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-gradient-to-br from-emerald-500/10 via-gray-50 to-gray-100 dark:from-emerald-500/15 dark:via-gray-900 dark:to-gray-950 border border-gray-100 dark:border-gray-800 mb-4 flex items-center justify-center">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor" className="text-accent group-hover:scale-110 transition-transform duration-500">
                      <path d="M12 2l2 6.2L20 10l-6 2.2L12 18l-2-5.8L4 10l6-1.8L12 2z" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-mono font-semibold tracking-wide text-accent uppercase mb-1">AI Tool</p>
                  <p className="font-display font-semibold text-gray-900 dark:text-gray-100 group-hover:text-accent transition-colors">AI Background Remover</p>
                  <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Remove image backgrounds instantly — free, no uploads, runs in your browser.
                  </p>
                </Link>
              </div>

              <div className="col-span-9 grid grid-cols-4 gap-x-8 gap-y-8">
                {PDF_TOOL_GROUPS.map(([group, tools]) => (
                  <div key={group} className="mega-col">
                    <span className="block text-[10px] font-mono font-bold tracking-[0.15em] uppercase text-gray-900 dark:text-gray-100 mb-4">{group}</span>
                    <ul className="space-y-2.5">
                      {tools.map((t) => (
                        <li key={t.slug}>
                          <Link
                            href={`/pdf-tools?tool=${t.slug}`}
                            onClick={megaCloseAll}
                            className="text-[12px] font-mono text-gray-600 dark:text-gray-400 hover:text-accent transition-colors"
                          >
                            {t.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="mega-col">
                  <span className="block text-[10px] font-mono font-bold tracking-[0.15em] uppercase text-gray-900 dark:text-gray-100 mb-4">Browse All</span>
                  <ul className="space-y-2.5">
                    <li>
                      <Link
                        href="/pdf-tools"
                        onClick={megaCloseAll}
                        className="text-sm font-mono font-semibold text-accent hover:text-accent-dark transition-colors inline-flex items-center gap-1"
                      >
                        All Tools <ArrowRight size={13} />
                      </Link>
                    </li>
                    <li>
                      <Link href="/bg-remover" onClick={megaCloseAll} className="text-[12px] font-mono text-gray-600 dark:text-gray-400 hover:text-accent transition-colors">
                        AI Background Remover
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ MEGA PANEL — SERVICES ═══ */}
        <div
          id="bs-mega-services"
          className={`bs-mega-panel${activeMega === "services" ? " bs-mega-open" : ""}`}
          role="region"
          aria-label="Services menu"
          onMouseEnter={megaCancelClose}
          onMouseLeave={megaScheduleClose}
        >
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10">
            <div className="grid grid-cols-12 gap-10">
              <div className="mega-col col-span-3 pr-8">
                <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-gray-400 dark:text-gray-500 uppercase mb-4">Get Started</p>
                <Link href="/contact" className="group block">
                  <div className="aspect-[4/5] rounded-lg bg-gradient-to-br from-emerald-500/10 via-gray-50 to-gray-100 dark:from-emerald-500/15 dark:via-gray-900 dark:to-gray-950 border border-gray-100 dark:border-gray-800 mb-4 flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="text-accent group-hover:scale-110 transition-transform duration-500">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    <span className="font-display font-bold text-gray-900 dark:text-gray-100">Not sure where to start?</span>
                    <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 leading-relaxed">
                      Tell us your idea — we&apos;ll map the stack, timeline, and budget with you.
                    </span>
                  </div>
                  <p className="text-sm font-mono font-semibold text-accent inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Free Consultation <ArrowRight size={13} />
                  </p>
                </Link>
              </div>

              <div className="col-span-9 grid grid-cols-3 gap-x-8 gap-y-8">
                {serviceGroups.map((svc) => (
                  <div key={svc.id} className="mega-col">
                    <Link
                      href="/services"
                      onClick={megaCloseAll}
                      className="block text-[10px] font-mono font-bold tracking-[0.15em] uppercase text-gray-900 dark:text-gray-100 mb-4 hover:text-accent transition-colors"
                    >
                      {svc.name}
                    </Link>
                    <ul className="space-y-2.5">
                      {svc.items.slice(0, 8).map((item) => (
                        <li key={item}>
                          <Link
                            href={contactServiceHref(item)}
                            onClick={megaCloseAll}
                            className="text-[12px] font-mono text-gray-600 dark:text-gray-400 hover:text-accent transition-colors"
                          >
                            {item}
                          </Link>
                        </li>
                      ))}
                      {svc.items.length > 8 && (
                        <li>
                          <Link href="/services" onClick={megaCloseAll} className="text-[11px] font-mono text-gray-400 dark:text-gray-500 hover:text-accent transition-colors">
                            + {svc.items.length - 8} more
                          </Link>
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
                <div className="mega-col">
                  <span className="block text-[10px] font-mono font-bold tracking-[0.15em] uppercase text-gray-900 dark:text-gray-100 mb-4">Browse All</span>
                  <ul className="space-y-2.5">
                    <li>
                      <Link
                        href="/services"
                        onClick={megaCloseAll}
                        className="text-sm font-mono font-semibold text-accent hover:text-accent-dark transition-colors inline-flex items-center gap-1"
                      >
                        All Services <ArrowRight size={13} />
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ MOBILE MENU (full screen, below the header bar) ═══ */}
        <aside id="bs-mobile-nav" className={drawerOpen ? "bs-open" : ""} aria-label="Mobile menu" aria-hidden={!drawerOpen} inert={!drawerOpen}>
          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6">
            <nav className="space-y-0.5" aria-label="Main">
              <Link href="/" onClick={closeDrawer} className={drawerLink(pathname === "/")}>
                <Home className="bs-dicon" aria-hidden="true" /> Home
              </Link>

              <button className={drawerAccBtn(isActive("/services"))} onClick={() => toggleAcc("m-services")} aria-expanded={!!openAcc["m-services"]}>
                <span className="flex items-center gap-3">
                  <Layers className="bs-dicon" aria-hidden="true" /> Services
                </span>
                <Chevron className="bs-acc-chevron" />
              </button>
              {openAcc["m-services"] && (
                <div className="ml-9 border-l border-gray-100 dark:border-gray-800 pl-3 pb-2">
                  {serviceGroups.map((cat) => (
                    <div key={cat.id} className="pt-2">
                      <p className="px-3 pb-1 text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">{cat.name}</p>
                      {cat.items.map((item) => (
                        <Link key={item} href={contactServiceHref(item)} onClick={closeDrawer} className={drawerSubLink}>
                          {item}
                        </Link>
                      ))}
                    </div>
                  ))}
                  <Link href="/services" onClick={closeDrawer} className="mt-1 flex items-center gap-1 px-3 py-2 font-mono text-sm font-semibold text-accent">
                    All services <ArrowRight size={14} />
                  </Link>
                </div>
              )}

              <button className={drawerAccBtn(toolsActive)} onClick={() => toggleAcc("m-tools")} aria-expanded={!!openAcc["m-tools"]}>
                <span className="flex items-center gap-3">
                  <Wrench className="bs-dicon" aria-hidden="true" /> Free tools
                </span>
                <Chevron className="bs-acc-chevron" />
              </button>
              {openAcc["m-tools"] && (
                <div className="ml-9 border-l border-gray-100 dark:border-gray-800 pl-3 pb-2">
                  {PDF_TOOL_GROUPS.map(([group, tools]) => (
                    <div key={group} className="pt-2">
                      <p className="px-3 pb-1 text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">{group}</p>
                      {tools.map((t) => (
                        <Link key={t.slug} href={`/pdf-tools?tool=${t.slug}`} onClick={closeDrawer} className={drawerSubLink}>
                          {t.name}
                        </Link>
                      ))}
                    </div>
                  ))}
                  <div className="pt-2">
                    <p className="px-3 pb-1 text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">AI</p>
                    <Link href="/bg-remover" onClick={closeDrawer} className={drawerSubLink}>
                      Background Remover
                    </Link>
                  </div>
                  <Link href="/pdf-tools" onClick={closeDrawer} className="mt-1 flex items-center gap-1 px-3 py-2 font-mono text-sm font-semibold text-accent">
                    All PDF tools <ArrowRight size={14} />
                  </Link>
                </div>
              )}

              {NAV_LINKS.map((l) => {
                const Icon = DRAWER_ICONS[l.href] ?? Home;
                return (
                  <Link key={l.href} href={l.href} onClick={closeDrawer} className={drawerLink(isActive(l.href))}>
                    <Icon className="bs-dicon" aria-hidden="true" /> {l.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3">
            <Link
              href="/contact"
              onClick={closeDrawer}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-accent hover:bg-accent-light text-gray-950 font-mono text-sm font-bold px-5 py-3.5 transition-colors"
            >
              Get a free quote <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {contact && (
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    [`mailto:${contact.email}`, "Email", Mail],
                    [contact.phoneHref, "Call", Phone],
                    [contact.whatsappHref, "WhatsApp", MessageCircle],
                  ] as const
                )
                  .filter(([href]) => href)
                  .map(([href, label, Icon]) => (
                    <a
                      key={label}
                      href={href}
                      {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="flex flex-col items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-800 py-2.5 text-[11px] font-mono text-gray-600 dark:text-gray-400 hover:border-accent/40 hover:text-accent transition-colors"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {label}
                    </a>
                  ))}
              </div>
            )}
          </div>
        </aside>
      </nav>

      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} services={services} docs={searchDocs} />
    </>
  );
}
