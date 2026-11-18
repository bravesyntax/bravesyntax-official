import Image from "next/image";
import { cn } from "@/lib/utils";

/** A 3D paperback built from the real front cover: cover face, spine, page edges and a soft floor shadow. */
export function BookMockup({ src, alt, className, priority = false, tilt = true }: { src: string; alt: string; className?: string; priority?: boolean; tilt?: boolean }) {
  return (
    <div className={cn("group relative mx-auto [perspective:1600px]", className)}>
      <div
        className={cn(
          "relative aspect-[148/210] w-full [transform-style:preserve-3d] transition-transform duration-500 ease-out motion-reduce:transition-none",
          tilt && "[transform:rotateY(-26deg)_rotateX(6deg)] group-hover:[transform:rotateY(-14deg)_rotateX(4deg)]",
        )}
      >
        {/* page block, seen along the right edge */}
        <div
          aria-hidden
          className="absolute top-[1.2%] right-0 h-[97.6%] w-[5.5%] origin-right [transform:rotateY(90deg)] bg-[repeating-linear-gradient(90deg,#f8fafc_0_2px,#e2e8f0_2px_3px)]"
        />
        {/* spine */}
        <div aria-hidden className="absolute top-0 left-0 h-full w-[6%] origin-left [transform:rotateY(90deg)] bg-gradient-to-b from-[#0b3a2c] via-[#062a20] to-[#041d16]" />
        {/* front cover */}
        <div className="absolute inset-0 overflow-hidden rounded-r-[6px] rounded-l-[2px] shadow-[0_30px_60px_-20px_rgba(2,44,34,0.55),0_10px_20px_-10px_rgba(0,0,0,0.4)]">
          <Image src={src} alt={alt} fill priority={priority} sizes="(min-width: 1024px) 380px, 70vw" className="object-cover" />
          {/* light sweep and spine crease */}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/35 via-white/0 to-white/10" />
          <div aria-hidden className="absolute inset-y-0 left-[3.5%] w-px bg-white/15" />
        </div>
      </div>
      {/* floor shadow */}
      <div aria-hidden className="mx-auto mt-4 h-4 w-[80%] rounded-[50%] bg-black/25 blur-md dark:bg-black/60" />
    </div>
  );
}
