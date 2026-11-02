"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, Building2, Code2, FileText, GraduationCap, ImageIcon, Layers, Mail, Newspaper, Palette, Users, X, type LucideIcon } from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { contactServiceHref, PDF_TOOLS, type NavService } from "@/lib/navigation";

// Command palette search (from includes/search-overlay.php). Opens with Ctrl/Cmd+K.

type Item = { title: string; sub?: string; url: string; icon: LucideIcon; section: string };
/** A blog post or case study the search can find (titles are passed in from the server). */
export type SearchDoc = { title: string; url: string; kind: "post" | "project"; sub: string | null };

const QUICK_ACTIONS: Item[] = [
  { url: "/services", icon: Layers, title: "View all services", sub: "Design, development and growth", section: "Quick Actions" },
  { url: "/portfolio", icon: Briefcase, title: "Our portfolio", sub: "Case studies and recent work", section: "Quick Actions" },
  { url: "/contact", icon: Mail, title: "Get a quote", sub: "Start a project with us", section: "Quick Actions" },
  { url: "/pdf-tools", icon: FileText, title: "Free PDF tools", sub: "Merge, split, compress — in your browser", section: "Quick Actions" },
];

const PAGES: Item[] = [
  { title: "Services", sub: "All design & development services", url: "/services", icon: Layers, section: "Pages" },
  { title: "Portfolio", sub: "Selected work and case studies", url: "/portfolio", icon: Briefcase, section: "Pages" },
  { title: "Industries", sub: "Sectors we build for", url: "/industries", icon: Building2, section: "Pages" },
  { title: "About us", sub: "Our team, story and values", url: "/about", icon: Users, section: "Pages" },
  { title: "Blog", sub: "Guides and insights", url: "/blog", icon: Newspaper, section: "Pages" },
  { title: "Careers", sub: "Open roles and internships", url: "/careers", icon: GraduationCap, section: "Pages" },
  { title: "Contact", sub: "Get a quote or start a project", url: "/contact", icon: Mail, section: "Pages" },
  { title: "Background remover", sub: "Free AI tool, transparent PNG", url: "/bg-remover", icon: ImageIcon, section: "Free Tools" },
  ...PDF_TOOLS.map((t) => ({ title: t.name, sub: t.desc, url: `/pdf-tools?tool=${t.slug}`, icon: FileText, section: "Free Tools" })),
];

const serviceIcon = (category: string) => (category === "design" ? Palette : Code2);
const ChevronRight = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

function Highlight({ text, q }: { text: string; q: string }) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (!q || i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-accent/20 text-accent rounded px-0.5 not-italic">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export default function SearchPalette({ open, onOpenChange, services = [], docs = [] }: { open: boolean; onOpenChange: (o: boolean) => void; services?: NavService[]; docs?: SearchDoc[] }) {
  const router = useRouter();
  // Services come from Admin → Services, so search always matches what the site offers.
  const serviceItems = useMemo<Item[]>(
    () => services.map((x) => ({ title: x.title, sub: x.category === "design" ? "Design service" : "Development service", url: contactServiceHref(x.title), icon: serviceIcon(x.category), section: "Services" })),
    [services],
  );
  const popular = useMemo(() => serviceItems.slice(0, 6), [serviceItems]);
  const docItems = useMemo<Item[]>(
    () =>
      docs.map((d) => ({
        title: d.title,
        sub: d.kind === "post" ? `Blog${d.sub ? ` · ${d.sub.charAt(0).toUpperCase()}${d.sub.slice(1)}` : ""}` : `Case study${d.sub ? ` · ${d.sub.charAt(0).toUpperCase()}${d.sub.slice(1)}` : ""}`,
        url: d.url,
        icon: d.kind === "post" ? Newspaper : Briefcase,
        section: d.kind === "post" ? "Blog" : "Case Studies",
      })),
    [docs],
  );
  const searchItems = useMemo(
    () => [...PAGES.filter((p) => p.section === "Pages"), ...serviceItems, ...docItems.filter((d) => d.section === "Case Studies"), ...docItems.filter((d) => d.section === "Blog"), ...PAGES.filter((p) => p.section !== "Pages")],
    [serviceItems, docItems],
  );
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [visible, setVisible] = useState(false); // drives the scale/opacity transition
  const [mounted, setMounted] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Open/close with a short transition, as in the original overlay
  useEffect(() => {
    if (open) {
      setMounted(true);
      document.body.style.overflow = "hidden";
      const raf = requestAnimationFrame(() => setVisible(true));
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(t);
      };
    }
    setVisible(false);
    const t = setTimeout(() => {
      setMounted(false);
      setQuery("");
      setDebounced("");
      setActiveIdx(-1);
      document.body.style.overflow = "";
    }, 140);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 120);
    return () => clearTimeout(t);
  }, [query]);

  const hits = useMemo(() => {
    if (!debounced) return null;
    // Every word must appear somewhere in the item (any order): "guide seo" finds "The Ultimate SEO Guide".
    const words = debounced.toLowerCase().split(/\s+/).filter(Boolean);
    return searchItems.filter((i) => {
      const hay = `${i.title} ${i.sub ?? ""} ${i.section}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [debounced, searchItems]);

  const items = useMemo(() => hits ?? [...QUICK_ACTIONS, ...popular], [hits, popular]);

  useEffect(() => setActiveIdx(-1), [debounced]);

  // Ctrl/Cmd+K toggles; arrows/enter/escape navigate while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
        return;
      }
      if (!open) return;
      if (e.key === "Escape") onOpenChange(false);
      else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && activeIdx >= 0 && items[activeIdx]) {
        router.push(items[activeIdx].url);
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange, items, activeIdx, router]);

  useEffect(() => {
    itemRefs.current[activeIdx]?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  if (!mounted) return null;

  const close = () => onOpenChange(false);
  const activeCls = (i: number) => (i === activeIdx ? " bg-zinc-800/70" : "");
  const ref = (i: number) => (el: HTMLAnchorElement | null) => {
    itemRefs.current[i] = el;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal="true" aria-label="Search">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      <div
        className="relative w-full max-w-[640px] bg-[#1c1c1e] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          transform: visible ? "scale(1)" : "scale(.97)",
          opacity: visible ? 1 : 0,
          transition: "transform .15s cubic-bezier(.4,0,.2,1),opacity .15s ease",
        }}
      >
        <div className="flex items-center gap-3 px-5 border-b border-zinc-800/80" style={{ height: 60 }}>
          <svg className="w-[18px] h-[18px] text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything…"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 bg-[transparent!important] text-[15px] text-white placeholder-zinc-600 focus:outline-none font-sans"
          />
          <button
            onClick={close}
            aria-label="Close search"
            className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
          {hits === null ? (
            <div>
              <div className="px-5 pt-5 pb-1">
                <p className="text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-widest mb-2">Quick Actions</p>
                <div className="space-y-0.5">
                  {QUICK_ACTIONS.map((a, i) => (
                    <Link
                      key={a.title}
                      ref={ref(i)}
                      href={a.url}
                      onClick={close}
                      className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-zinc-800/70 transition-colors group cursor-pointer${activeCls(i)}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 border border-zinc-700/50 flex items-center justify-center flex-shrink-0 transition-colors">
                        <a.icon className="w-4 h-4 text-zinc-400 group-hover:text-accent transition-colors" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] text-zinc-200 font-medium leading-tight">{a.title}</div>
                        <div className="text-[11px] text-zinc-500 mt-0.5 truncate">{a.sub}</div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 flex-shrink-0 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
              <div className="px-5 pt-4 pb-5">
                {popular.length > 0 && <p className="text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-widest mb-2">Popular Services</p>}
                <div className="space-y-0.5">
                  {popular.map((p, j) => {
                    const i = QUICK_ACTIONS.length + j;
                    return (
                      <Link
                        key={p.title}
                        ref={ref(i)}
                        href={p.url}
                        onClick={close}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-zinc-800/70 transition-colors group cursor-pointer${activeCls(i)}`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-zinc-800/80 border border-zinc-700/40 flex items-center justify-center flex-shrink-0">
                          <p.icon className="w-3.5 h-3.5 text-zinc-500 group-hover:text-accent transition-colors" aria-hidden="true" />
                        </div>
                        <span className="text-[13px] text-zinc-400 group-hover:text-zinc-200 transition-colors">{p.title}</span>
                        <ChevronRight className="w-3 h-3 text-zinc-700 group-hover:text-zinc-500 ml-auto flex-shrink-0 transition-colors" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : hits.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-[13px] text-zinc-400 font-medium">No results found</p>
              <p className="text-[11px] text-zinc-600 mt-1">Try different keywords</p>
            </div>
          ) : (
            <div className="px-3 py-3 space-y-0.5">
              {hits.map((item, i) => (
                <Fragment key={item.title + item.section}>
                  {(i === 0 || hits[i - 1].section !== item.section) && (
                    <p className="text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-widest px-3 pt-3 pb-1.5">{item.section}</p>
                  )}
                  <Link
                    ref={ref(i)}
                    href={item.url}
                    onClick={close}
                    className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-zinc-800/70 transition-colors group cursor-pointer${activeCls(i)}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-zinc-400 group-hover:text-accent transition-colors" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] text-zinc-200 font-medium leading-tight">
                        <Highlight text={item.title} q={debounced} />
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5 truncate">{item.sub}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 flex-shrink-0 transition-colors" />
                  </Link>
                </Fragment>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 px-5 py-3 border-t border-zinc-800/80 bg-zinc-900/40">
          {[
            [["↑", "↓"], "to navigate"],
            [["↵"], "to select"],
            [["Esc"], "to close"],
          ].map(([keys, label]) => (
            <div key={label as string} className="flex items-center gap-1.5">
              {(keys as string[]).map((k) => (
                <kbd key={k} className="inline-flex items-center justify-center min-w-5 h-5 px-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-400 font-mono">
                  {k}
                </kbd>
              ))}
              <span className="text-[11px] text-zinc-600 ml-0.5">{label as string}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-600">Ctrl</span>
            <kbd className="inline-flex items-center justify-center w-5 h-5 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-400 font-mono">K</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
