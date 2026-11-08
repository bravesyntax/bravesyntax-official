"use client";

import {
  Briefcase, ChartNoAxesColumn, MailPlus, ExternalLink, FileText, FolderGit2, FolderKanban, Inbox, LayoutDashboard, LogOut, Mail, MapPin, Menu, Moon, Newspaper, Search, Settings,
  Wrench, X, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/admin/login/actions";
import Logo from "@/components/Logo";

type NavItem = [href: string, label: string, icon: LucideIcon];

const GROUPS: [title: string, items: NavItem[]][] = [
  ["", [["/admin", "Dashboard", LayoutDashboard], ["/admin/messages", "Messages", Inbox]]],
  [
    "Content",
    [
      ["/admin/services", "Services", Wrench],
      ["/admin/portfolio", "Portfolio", FolderKanban],
      ["/admin/github", "GitHub Projects", FolderGit2],
      ["/admin/blog", "Blog", Newspaper],
      ["/admin/careers", "Careers", Briefcase],
      ["/admin/legal", "Legal Pages", FileText],
    ],
  ],
  [
    "SEO & Growth",
    [
      ["/admin/leads", "Leads", ChartNoAxesColumn],
      ["/admin/newsletter", "Newsletter", MailPlus],
      ["/admin/seo", "SEO", Search],
      ["/admin/location", "Location Pages", MapPin],
    ],
  ],
  ["System", [["/admin/emails", "Email Templates", Mail], ["/admin/settings", "Settings", Settings]]],
];

function toggleTheme() {
  const h = document.documentElement;
  h.classList.toggle("dark");
  document.cookie = `theme=${h.classList.contains("dark") ? "dark" : "light"};path=/;max-age=31536000;SameSite=Lax`;
}

function NavContent({ unread, isActive, onNavigate }: { unread: number; isActive: (href: string) => boolean; onNavigate?: () => void }) {
  return (
    <>
      <nav className="flex-1 space-y-6 overflow-y-auto p-4" aria-label="Admin">
        {GROUPS.map(([title, items]) => (
          <div key={title || "main"}>
            {title && <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">{title}</p>}
            <div className="space-y-0.5">
              {items.map(([href, label, Icon]) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active ? "bg-brand/10 font-medium text-brand" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-brand" : "text-zinc-500 group-hover:text-zinc-300"}`} aria-hidden="true" />
                    {label}
                    {href === "/admin/messages" && unread > 0 && (
                      <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white" aria-label={`${unread} unread`}>
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="space-y-0.5 border-t border-zinc-800 p-4">
        <button onClick={toggleTheme} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-white">
          <Moon className="h-4 w-4" aria-hidden="true" /> Toggle theme
        </button>
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-white">
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> View website
        </a>
        <form action={logout}>
          <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
          </button>
        </form>
      </div>
    </>
  );
}

const Brand = () => (
  <Link href="/admin" className="inline-flex" aria-label="Brave Syntax — Dashboard">
    <Logo className="h-6" />
  </Link>
);

export default function AdminSidebar({ unread }: { unread: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col border-r border-zinc-800 bg-black lg:flex">
        <div className="border-b border-zinc-800 px-6 py-5">
          <Brand />
          <p className="mt-1 text-[11px] text-zinc-500">Admin panel</p>
        </div>
        <NavContent unread={unread} isActive={isActive} />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="relative z-50 flex h-14 flex-shrink-0 items-center justify-between border-b border-zinc-800 bg-black px-4 lg:hidden">
        <Brand />
        <button onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="relative rounded-lg p-2 text-zinc-300 hover:bg-zinc-900">
          <Menu className="h-5 w-5" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-zinc-800 bg-black">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <Brand />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavContent unread={unread} isActive={isActive} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
