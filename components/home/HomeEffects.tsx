"use client";

import { useEffect } from "react";

// Scroll-reveal for `.bsh-reveal` elements and parallax for `[data-parallax-speed]`.
// Renders nothing; it only wires up behaviour on the server-rendered markup.
export default function HomeEffects() {
  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>(".bsh-reveal");
    let observer: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("bsh-in");
              observer!.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -80px 0px" },
      );
      reveals.forEach((el) => observer!.observe(el));
    } else {
      reveals.forEach((el) => el.classList.add("bsh-in"));
    }

    const parallax = document.querySelectorAll<HTMLElement>("[data-parallax-speed]");
    const onScroll = () => {
      const y = window.scrollY;
      parallax.forEach((el) => {
        const speed = parseFloat(el.dataset.parallaxSpeed ?? "") || 0.5;
        el.style.transform = `translateY(${y * speed}px)`;
      });
    };
    if (parallax.length) {
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
