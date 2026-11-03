"use client";

import { ArrowRight, Check, Menu, MessageCircle, Search, ShoppingBag, Sparkles, type LucideIcon, Dumbbell, GraduationCap, Home, Stethoscope, UtensilsCrossed } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// The hero's hook: type a business name and a sample website for it appears straight away. Until someone
// touches it, it plays by itself, typing sample names and switching industries, so the page feels alive on arrival.

type Template = {
  id: string;
  label: string;
  sample: string;
  icon: LucideIcon;
  headline: string;
  sub: string;
  cta: string;
  items: [string, string][];
  /** bg, text, muted text, accent, text on accent, card, hero image gradient */
  c: { bg: string; fg: string; muted: string; accent: string; onAccent: string; card: string; art: string };
};

const TEMPLATES: Template[] = [
  {
    id: "restaurant",
    label: "Restaurant",
    sample: "Sharma Sweets",
    icon: UtensilsCrossed,
    headline: "Food your whole family will love",
    sub: "Fresh every day. Order online or book a table in seconds.",
    cta: "Order on WhatsApp",
    items: [["Thali", "Lunch specials"], ["Sweets", "Made fresh daily"], ["Catering", "For every occasion"]],
    c: { bg: "#1c1310", fg: "#fff7ed", muted: "#d6c4b4", accent: "#f59e0b", onAccent: "#1c1310", card: "#2c1e18", art: "linear-gradient(135deg,#f59e0b,#b91c1c)" },
  },
  {
    id: "clinic",
    label: "Clinic",
    sample: "City Care Clinic",
    icon: Stethoscope,
    headline: "Expert care, close to your home",
    sub: "See the right doctor without the wait. Book your visit online.",
    cta: "Book an appointment",
    items: [["General care", "Open all week"], ["Dental", "Gentle treatment"], ["Lab tests", "Reports online"]],
    c: { bg: "#f0f9ff", fg: "#0c2d48", muted: "#47657d", accent: "#0284c7", onAccent: "#ffffff", card: "#ffffff", art: "linear-gradient(135deg,#38bdf8,#0369a1)" },
  },
  {
    id: "property",
    label: "Real estate",
    sample: "Green Valley Homes",
    icon: Home,
    headline: "Find a home you'll never want to leave",
    sub: "Verified properties and honest advice, from visit to keys.",
    cta: "Book a site visit",
    items: [["2 BHK", "Ready to move"], ["3 BHK", "Premium towers"], ["Plots", "Great locations"]],
    c: { bg: "#0f1f1a", fg: "#ecfdf5", muted: "#a7c4b8", accent: "#34d399", onAccent: "#06281d", card: "#16302a", art: "linear-gradient(135deg,#34d399,#0f766e)" },
  },
  {
    id: "store",
    label: "Online store",
    sample: "Riya Boutique",
    icon: ShoppingBag,
    headline: "New arrivals, delivered to your door",
    sub: "Shop the latest styles, pay your way, and get easy returns.",
    cta: "Shop the collection",
    items: [["Sarees", "New this week"], ["Kurtis", "Everyday style"], ["Jewellery", "Finishing touches"]],
    c: { bg: "#fff1f5", fg: "#4a0d24", muted: "#8a4a60", accent: "#e11d63", onAccent: "#ffffff", card: "#ffffff", art: "linear-gradient(135deg,#fb7185,#a21caf)" },
  },
  {
    id: "school",
    label: "School",
    sample: "Bright Future Academy",
    icon: GraduationCap,
    headline: "Where bright futures begin",
    sub: "Caring teachers and modern classrooms. Admissions are open.",
    cta: "Apply for admission",
    items: [["Primary", "Strong foundations"], ["Secondary", "Exam ready"], ["Activities", "Sports and arts"]],
    c: { bg: "#eef2ff", fg: "#1e1b4b", muted: "#55528a", accent: "#4f46e5", onAccent: "#ffffff", card: "#ffffff", art: "linear-gradient(135deg,#818cf8,#7c3aed)" },
  },
  {
    id: "gym",
    label: "Gym",
    sample: "Iron House Fitness",
    icon: Dumbbell,
    headline: "Get stronger, starting today",
    sub: "Expert trainers and plans that fit your life. Try a free session.",
    cta: "Claim a free session",
    items: [["Strength", "Personal training"], ["Yoga", "Morning batches"], ["Diet plans", "Made for you"]],
    c: { bg: "#0b0d0a", fg: "#f7fee7", muted: "#b0b8a6", accent: "#a3e635", onAccent: "#1a2e05", card: "#171a13", art: "linear-gradient(135deg,#a3e635,#15803d)" },
  },
];

const stagger = (reduce: boolean | null, i: number) => (reduce ? { duration: 0 } : { delay: 0.05 + i * 0.07, duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] as const });
const rise = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

function SiteLogo({ t, name, size }: { t: Template; name: string; size: string }) {
  const Icon = t.icon;
  return (
    <span className="flex min-w-0 items-center gap-[0.35em] font-bold" style={{ fontSize: size }}>
      <span className="grid size-[1.5em] shrink-0 place-items-center rounded-[0.35em]" style={{ background: t.c.accent, color: t.c.onAccent }}>
        <Icon className="size-[0.95em]" aria-hidden="true" />
      </span>
      <span className="truncate">{name}</span>
    </span>
  );
}

/** The sample site. Sizes use cqw, so it scales with its frame like a real page in a smaller window. */
function SamplePage({ t, name, reduce }: { t: Template; name: string; reduce: boolean | null }) {
  return (
    <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.2 }} className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: t.c.bg, color: t.c.fg }}>
      <div className="flex items-center justify-between gap-[3cqw] px-[4cqw] py-[2.4cqw]">
        <SiteLogo t={t} name={name} size="2.6cqw" />
        <div className="flex shrink-0 items-center gap-[2.4cqw] text-[1.9cqw]" style={{ color: t.c.muted }}>
          <span>Home</span>
          <span>About</span>
          <span>Contact</span>
          <Search className="size-[2.4cqw]" aria-hidden="true" />
        </div>
      </div>
      <div className="grid flex-1 grid-cols-[1.15fr_1fr] items-center gap-[3cqw] px-[4cqw]">
        <div>
          <motion.p {...rise} transition={stagger(reduce, 0)} className="truncate text-[2cqw] font-semibold" style={{ color: t.c.accent }}>
            Welcome to {name}
          </motion.p>
          <motion.h3 {...rise} transition={stagger(reduce, 1)} className="mt-[1cqw] text-[5cqw] leading-[1.08] font-bold tracking-tight">
            {t.headline}
          </motion.h3>
          <motion.p {...rise} transition={stagger(reduce, 2)} className="mt-[1.4cqw] text-[2.1cqw] leading-snug" style={{ color: t.c.muted }}>
            {t.sub}
          </motion.p>
          <motion.span {...rise} transition={stagger(reduce, 3)} className="mt-[2cqw] inline-block rounded-full px-[2.8cqw] py-[1.2cqw] text-[2cqw] font-semibold" style={{ background: t.c.accent, color: t.c.onAccent }}>
            {t.cta}
          </motion.span>
        </div>
        <motion.div initial={reduce ? false : { opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={stagger(reduce, 2)} className="relative grid aspect-[5/4] place-items-center overflow-hidden rounded-[2cqw]" style={{ background: t.c.art }}>
          <t.icon className="size-[13cqw] text-white/90" strokeWidth={1.25} aria-hidden="true" />
        </motion.div>
      </div>
      <div className="grid grid-cols-3 gap-[1.6cqw] p-[4cqw] pt-[2.6cqw]">
        {t.items.map(([title, note], i) => (
          <motion.div key={title} {...rise} transition={stagger(reduce, 4 + i)} className="min-w-0 rounded-[1.4cqw] p-[1.6cqw]" style={{ background: t.c.card }}>
            <p className="truncate text-[2.1cqw] font-semibold">{title}</p>
            <p className="truncate text-[1.7cqw]" style={{ color: t.c.muted }}>
              {note}
            </p>
          </motion.div>
        ))}
      </div>
      <span className="absolute right-[2.4cqw] bottom-[2.4cqw] grid size-[5.4cqw] place-items-center rounded-full bg-[#25d366] text-white shadow-lg">
        <MessageCircle className="size-[3cqw]" aria-hidden="true" />
      </span>
    </motion.div>
  );
}

/** The same site at phone width, to show that it adapts. */
function SamplePhone({ t, name }: { t: Template; name: string }) {
  return (
    <div className="absolute inset-0 flex flex-col transition-colors duration-300" style={{ background: t.c.bg, color: t.c.fg }}>
      <div className="flex items-center justify-between gap-[3cqw] px-[6cqw] pt-[9cqw] pb-[4cqw]">
        <SiteLogo t={t} name={name} size="7.5cqw" />
        <Menu className="size-[9cqw] shrink-0" aria-hidden="true" />
      </div>
      <div className="mx-[6cqw] grid h-[28cqw] shrink-0 place-items-center rounded-[5cqw]" style={{ background: t.c.art }}>
        <t.icon className="size-[16cqw] text-white/90" strokeWidth={1.25} aria-hidden="true" />
      </div>
      <p className="mx-[6cqw] mt-[5cqw] text-[10cqw] leading-[1.08] font-bold tracking-tight">{t.headline}</p>
      <span className="mx-[6cqw] mt-[4cqw] shrink-0 truncate rounded-full py-[3cqw] text-center text-[6.5cqw] font-semibold" style={{ background: t.c.accent, color: t.c.onAccent }}>
        {t.cta}
      </span>
      <div className="mx-[6cqw] mt-[4cqw] grid gap-[2.5cqw]">
        {t.items.map(([title, note]) => (
          <div key={title} className="min-w-0 rounded-[3cqw] px-[4cqw] py-[2.5cqw]" style={{ background: t.c.card }}>
            <p className="truncate text-[6cqw] font-semibold">{title}</p>
            <p className="truncate text-[4.8cqw]" style={{ color: t.c.muted }}>
              {note}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HeroBuilder() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(TEMPLATES[0].sample);
  const [auto, setAuto] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const visible = useRef(true);
  const t = TEMPLATES[index];
  const shown = typed.trim() || t.sample;
  const quoteHref = `/contact?industry=${encodeURIComponent(t.label)}&business=${encodeURIComponent(shown)}`;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Demo mode: hold a sample, move to the next industry, and type its name out letter by letter.
  useEffect(() => {
    if (!auto || reduce) return;
    let timer: ReturnType<typeof setTimeout>;
    let i = index;
    const typeName = (name: string, n: number) => {
      setTyped(name.slice(0, n));
      timer = setTimeout(() => (n < name.length ? typeName(name, n + 1) : hold()), n < name.length ? 55 : 0);
    };
    const hold = () => {
      timer = setTimeout(() => {
        if (visible.current && !document.hidden) {
          i = (i + 1) % TEMPLATES.length;
          setIndex(i);
          typeName(TEMPLATES[i].sample, 1);
        } else hold();
      }, 3400);
    };
    hold();
    return () => clearTimeout(timer);
    // The loop tracks its own position, so it only restarts when demo mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, reduce]);

  const takeOver = () => {
    if (auto) setAuto(false);
  };

  return (
    <div ref={root} className="relative min-w-0">
      <div className="rounded-2xl border bg-card/90 p-3 shadow-xl shadow-primary/10 backdrop-blur sm:p-4">
        <label htmlFor="hero-business" className="flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" aria-hidden="true" /> See your business online. Type its name:
        </label>
        <input
          id="hero-business"
          data-testid="hero-name"
          value={typed}
          maxLength={32}
          autoComplete="off"
          placeholder="Your business name"
          onFocus={() => {
            if (auto) {
              setAuto(false);
              setTyped("");
            }
          }}
          onChange={(e) => {
            takeOver();
            setTyped(e.target.value);
          }}
          className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-base font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <div role="radiogroup" aria-label="Type of business" className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0">
          {TEMPLATES.map((x, i) => (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={i === index}
              onClick={() => {
                takeOver();
                if (auto) setTyped("");
                setIndex(i);
              }}
              className={cn("inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap transition-colors", i === index ? "border-transparent bg-primary font-medium text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground")}
            >
              <x.icon className="size-3.5" aria-hidden="true" /> {x.label}
            </button>
          ))}
        </div>
      </div>

      {/* Phones get the phone-sized preview: a laptop-shaped page would be too small to read. */}
      <div aria-hidden="true" className="mx-auto mt-5 w-60 overflow-hidden rounded-[1.6rem] border-[5px] border-foreground/90 bg-card shadow-2xl shadow-primary/20 sm:hidden">
        <div className="relative aspect-[9/16.5] w-full [container-type:inline-size]">
          <SamplePhone t={t} name={shown} />
        </div>
      </div>

      <div className="relative mt-4 hidden sm:block sm:pr-[13%]">
        <div className="overflow-hidden rounded-xl border bg-card shadow-2xl shadow-primary/15">
          <div className="flex items-center gap-1.5 border-b bg-muted/60 px-3 py-2">
            <span className="size-2.5 rounded-full bg-red-400" />
            <span className="size-2.5 rounded-full bg-amber-400" />
            <span className="size-2.5 rounded-full bg-green-400" />
            <span data-testid="hero-url" className="ml-2 min-w-0 flex-1 truncate rounded-md bg-background px-2.5 py-0.5 text-xs text-muted-foreground">
              {shown.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "") || "yourbusiness"}.com
            </span>
          </div>
          {/* A sample, so it's hidden from screen readers: it would otherwise read out as content of this page. */}
          <div aria-hidden="true" className="relative aspect-[16/10] w-full [container-type:inline-size]">
            <AnimatePresence initial={false}>
              <SamplePage key={t.id} t={t} name={shown} reduce={reduce} />
            </AnimatePresence>
          </div>
        </div>
        <div aria-hidden="true" className="absolute right-0 -bottom-4 w-[23%] overflow-hidden rounded-[1.1rem] border-4 border-foreground/90 bg-card shadow-2xl">
          <div className="relative aspect-[9/17] w-full [container-type:inline-size]">
            <SamplePhone t={t} name={shown} />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {["Sample design", "Works on phones", "WhatsApp button"].map((x) => (
            <li key={x} className="flex items-center gap-1">
              <Check className="size-3.5 text-primary" aria-hidden="true" /> {x}
            </li>
          ))}
        </ul>
        <Link href={quoteHref} data-testid="hero-quote" className="inline-flex h-10 min-w-0 shrink-0 items-center justify-center gap-1.5 rounded-full border border-primary/40 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
          <span className="max-w-60 truncate">Get a quote for {shown}</span> <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
