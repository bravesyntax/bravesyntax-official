"use client";

import { CreditCard, Database, Globe, Mail, ShoppingCart, Smartphone, UsersRound, type LucideIcon } from "lucide-react";
import { useRef, type RefObject } from "react";
import { AnimatedBeam } from "@/components/velora/animated-beam";

function Node({ icon: Icon, label, nodeRef, large }: { icon: LucideIcon; label: string; nodeRef: RefObject<HTMLDivElement | null>; large?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div ref={nodeRef} className={`z-10 grid place-items-center rounded-2xl border bg-card shadow-sm ${large ? "size-20 text-primary" : "size-12"}`}>
        <Icon className={large ? "size-8" : "size-5"} aria-hidden="true" />
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

// Website, store and app on the left share one backend with the tools on the right.
export default function ConnectedSystems() {
  const box = useRef<HTMLDivElement>(null);
  const hub = useRef<HTMLDivElement>(null);
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  const c = useRef<HTMLDivElement>(null);
  const d = useRef<HTMLDivElement>(null);
  const e = useRef<HTMLDivElement>(null);
  const f = useRef<HTMLDivElement>(null);

  return (
    <div ref={box} className="relative mx-auto flex w-full max-w-xl items-center justify-between gap-4 overflow-hidden rounded-3xl border bg-background p-6 sm:p-10">
      <div className="flex flex-col gap-6">
        <Node icon={Globe} label="Website" nodeRef={a} />
        <Node icon={ShoppingCart} label="Store" nodeRef={b} />
        <Node icon={Smartphone} label="App" nodeRef={c} />
      </div>
      <Node icon={Database} label="One backend" nodeRef={hub} large />
      <div className="flex flex-col gap-6">
        <Node icon={CreditCard} label="Payments" nodeRef={d} />
        <Node icon={UsersRound} label="CRM" nodeRef={e} />
        <Node icon={Mail} label="Email" nodeRef={f} />
      </div>
      <AnimatedBeam containerRef={box} fromRef={a} toRef={hub} curvature={40} />
      <AnimatedBeam containerRef={box} fromRef={b} toRef={hub} />
      <AnimatedBeam containerRef={box} fromRef={c} toRef={hub} curvature={-40} />
      <AnimatedBeam containerRef={box} fromRef={hub} toRef={d} curvature={40} reverse />
      <AnimatedBeam containerRef={box} fromRef={hub} toRef={e} reverse />
      <AnimatedBeam containerRef={box} fromRef={hub} toRef={f} curvature={-40} reverse />
    </div>
  );
}
