"use client";

import { Home, Mail, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import Logo from "@/components/Logo";

// Shown when a page can't be rendered, usually because the database couldn't be reached for a moment.
// "Try again" re-fetches the page from the server (reset() alone would re-render the same failed result).

export default function ErrorScreen({ error, reset, area = "site" }: { error: Error & { digest?: string }; reset: () => void; area?: "site" | "admin" }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
    document.title = "Something went wrong | Brave Syntax"; // error boundaries can't export metadata
  }, [error]);

  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  const secondary = "inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-5 py-3 font-mono text-sm text-zinc-700 transition-colors hover:border-emerald-500 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-emerald-400";

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-20">
      <div className="max-w-lg text-center">
        {area === "site" && (
          <div className="mb-10 flex justify-center">
            <Logo className="h-8" />
          </div>
        )}
        <h1 className="mb-3 font-display text-3xl font-bold text-zinc-900 dark:text-white">Something went wrong on our side</h1>
        <p className="mb-8 font-mono text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {area === "admin"
            ? "This screen couldn't load, most likely a brief connection problem. If you were saving something, check that it saved before trying again."
            : "This page couldn't load just now. It's usually a brief hiccup, so please try again in a moment."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={retry} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-mono text-sm font-bold text-black transition-colors hover:bg-emerald-400">
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
          </button>
          <Link href={area === "admin" ? "/admin" : "/"} className={secondary}>
            <Home className="h-4 w-4" aria-hidden="true" /> {area === "admin" ? "Dashboard" : "Home"}
          </Link>
          {area === "site" && (
            <a href="mailto:support@bravesyntax.com" className={secondary}>
              <Mail className="h-4 w-4" aria-hidden="true" /> Email us
            </a>
          )}
        </div>
        {error.digest && <p className="mt-8 font-mono text-[11px] text-zinc-500">Reference: {error.digest}</p>}
      </div>
    </main>
  );
}
