import Image from "next/image";

// The Brave Syntax logo (original artwork, public/brand/). Two versions swap with the theme: dark "Brave" on
// light backgrounds, white "Brave" on dark ones. Both are rendered; CSS shows the one for the current theme.

const W = 1200;
const H = 177;

export default function Logo({ className = "h-8", priority = false, sizes = "320px" }: { className?: string; priority?: boolean; sizes?: string }) {
  const img = (src: string, theme: string) => (
    <Image src={src} alt="Brave Syntax" width={W} height={H} priority={priority} sizes={sizes} className={`w-auto ${className} ${theme}`} />
  );
  return (
    <>
      {img("/brand/logo-on-light.png", "block dark:hidden")}
      {img("/brand/logo-on-dark.png", "hidden dark:block")}
    </>
  );
}
