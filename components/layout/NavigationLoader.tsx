"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { container } from "@/components/site/ui";
import { Skeleton } from "@/components/ui/skeleton";

// Feedback while moving between pages: a bar at the top straight away, and a skeleton of the next page if it takes
// long enough to notice. It runs in the browser rather than through loading.tsx, because a server loading boundary
// makes missing pages answer 200 instead of 404, which search engines would treat as real pages.

const SKELETON_DELAY = 150;
const GIVE_UP = 12000;
const FILE = /\.[a-z0-9]{2,5}$/i;

const isDetail = (path: string) => /^\/(services|industries|blog|portfolio)\/[^/]+/.test(path);

function HeroSkeleton() {
  return (
    <div className="flex flex-col gap-5 py-14 sm:py-20">
      <Skeleton className="h-7 w-40 rounded-full" />
      <Skeleton className="h-12 w-full max-w-2xl" />
      <Skeleton className="h-5 w-full max-w-xl" />
      <Skeleton className="h-5 w-4/5 max-w-lg" />
      <div className="mt-2 flex gap-3">
        <Skeleton className="h-11 w-36 rounded-full" />
        <Skeleton className="h-11 w-32 rounded-full" />
      </div>
    </div>
  );
}

function PageSkeleton({ path }: { path: string }) {
  return (
    <div className={container}>
      <HeroSkeleton />
      {isDetail(path) ? (
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border">
              <Skeleton className="aspect-[16/10] rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function NavigationLoader() {
  const pathname = usePathname();
  const [target, setTarget] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element).closest?.("a");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, location.href);
      // Filters and in-page links stay on the same path, so they get no loader.
      if (url.origin !== location.origin || url.pathname === location.pathname || FILE.test(url.pathname)) return;
      clear();
      setTarget(url.pathname);
      timers.current = [window.setTimeout(() => setShowSkeleton(true), SKELETON_DELAY), window.setTimeout(() => setTarget(null), GIVE_UP)];
    };
    // Capture phase: Link calls preventDefault on every click it handles, so afterwards they all look cancelled.
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clear();
    };
  }, []);

  // The new page has arrived.
  useEffect(() => {
    clear();
    setTarget(null);
    setShowSkeleton(false);
  }, [pathname]);

  if (!target) return null;
  return (
    <>
      <div aria-hidden="true" className="fixed inset-x-0 top-0 z-70 h-[3px] overflow-hidden">
        <div className="h-full animate-[nav-progress_8s_cubic-bezier(0.1,0.7,0.2,1)_forwards] rounded-r-full bg-primary" />
      </div>
      {showSkeleton && (
        <div role="status" className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-hidden bg-background">
          <span className="sr-only">Loading page</span>
          <PageSkeleton path={target} />
        </div>
      )}
    </>
  );
}
