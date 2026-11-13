"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * The 18-second brand reel in a phone frame. Nothing downloads until the frame nears the viewport;
 * it then plays muted on loop and pauses when scrolled away. Reduced-motion visitors start paused.
 */
export default function ReelVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const userPaused = useRef(false);

  // The source is attached on first use, so the page load never pays for the video.
  function start(video: HTMLVideoElement) {
    if (!video.getAttribute("src")) video.src = src;
    video.play().catch(() => {});
  }

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) userPaused.current = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!userPaused.current) start(video);
        } else if (!video.paused) {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(video);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- src is fixed for the component's life
  }, []);

  function toggle() {
    const video = ref.current;
    if (!video) return;
    userPaused.current = !video.paused;
    if (video.paused) start(video);
    else video.pause();
  }

  return (
    <div className="relative mx-auto w-full max-w-[18rem] sm:max-w-[20rem]">
      <div className="absolute -inset-10 -z-10 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
      <div className="rounded-[2.6rem] border border-white/10 bg-neutral-900 p-2.5 shadow-2xl shadow-black/50 ring-1 ring-white/5">
        <div className="relative overflow-hidden rounded-[2.1rem] bg-[#0a0d0c]">
          <div className="absolute top-2.5 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />
          <video
            ref={ref}
            className="block aspect-[9/16] w-full object-cover"
            poster={poster}
            muted
            loop
            playsInline
            preload="none"
            aria-label={label}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause video" : "Play video"}
            className="absolute right-3 bottom-5 z-10 grid size-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4 translate-x-px" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  );
}
