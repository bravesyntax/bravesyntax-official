"use client";

import { useRouter } from "next/navigation";
import { VanishInput } from "@/components/velora/vanish-input";

const PLACEHOLDERS = ["Search articles", "Try \"SEO\"", "Try \"e-commerce\"", "Try \"AI tools\""];

export default function BlogSearch() {
  const router = useRouter();
  return <VanishInput label="Search articles" placeholders={PLACEHOLDERS} className="max-w-md" onSubmit={(value) => router.push(`/blog?q=${encodeURIComponent(value.trim().slice(0, 80))}`)} />;
}
