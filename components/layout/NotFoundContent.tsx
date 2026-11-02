import Link from "next/link";

// Shared 404 body, used by app/not-found.tsx, app/(site)/not-found.tsx and the 410 page.
export default function NotFoundContent() {
  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-black pt-24" aria-label="Page not found">
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{ backgroundImage: "radial-gradient(circle,rgba(161,161,170,.15) 1px,transparent 1px)", backgroundSize: "28px 28px" }}
      />
      <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-emerald-500/[.08] rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-3xl mx-auto px-6 py-24 text-center">
        <p className="font-mono text-sm tracking-widest uppercase text-emerald-500 mb-6">Error 404</p>
        <h1 className="font-display font-bold text-6xl sm:text-7xl lg:text-8xl leading-none tracking-tight text-white mb-6">Page not found</h1>
        <p className="font-mono text-base sm:text-lg text-zinc-400 max-w-xl mx-auto mb-12 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist, may have been moved, or the link is out of date.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-sm rounded-xl shadow-[0_0_40px_rgba(16,185,129,.25)] transition-all"
          >
            Back to Home
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border border-zinc-700 text-zinc-300 hover:border-emerald-500 hover:text-emerald-500 font-mono font-semibold text-sm rounded-xl backdrop-blur-sm transition-all"
          >
            Contact Us
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-sm">
          {[
            ["/services", "Services"],
            ["/portfolio", "Portfolio"],
            ["/about", "About"],
            ["/blog", "Blog"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="text-zinc-400 hover:text-emerald-500 transition-colors">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
