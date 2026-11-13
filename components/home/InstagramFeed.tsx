import { ArrowUpRight, Copy, Play } from "lucide-react";
import { CtaLink, Section, SectionHeading } from "@/components/site/ui";
import { BlurFade } from "@/components/velora/blur-fade";
import type { InstagramPost } from "@/lib/instagram";

/** Latest Instagram posts as a square grid; each tile opens the post on Instagram. Renders nothing without posts. */
export default function InstagramFeed({ posts, username, profileUrl }: { posts: InstagramPost[]; username: string; profileUrl: string }) {
  if (posts.length === 0) return null;
  const href = profileUrl || (username ? `https://www.instagram.com/${username}/` : "");

  return (
    <Section muted label="Instagram">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <SectionHeading eyebrow={username ? `@${username}` : "Instagram"} title="Fresh from our Instagram">
          Tips, recent work and behind-the-scenes from the studio.
        </SectionHeading>
        {href && (
          <CtaLink href={href} variant="outline">
            Follow on Instagram
          </CtaLink>
        )}
      </div>
      <BlurFade delay={0.1} className="mt-10">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {posts.slice(0, 8).map((p) => {
            const alt = p.caption ? p.caption.replace(/\s+/g, " ").slice(0, 120) : "Instagram post";
            return (
              <li key={p.id}>
                <a
                  href={p.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block aspect-[4/5] overflow-hidden rounded-xl border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Instagram's signed CDN links; resizing them through next/image would only add cost */}
                  <img src={p.image} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  {p.type !== "IMAGE" && (
                    <span className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur" aria-hidden="true">
                      {p.type === "VIDEO" ? <Play className="size-3.5 translate-x-px" /> : <Copy className="size-3.5" />}
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-end bg-linear-to-t from-black/70 via-black/0 p-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-white">
                      View on Instagram <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </BlurFade>
    </Section>
  );
}
