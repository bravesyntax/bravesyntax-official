// Store catalog: the categories sold on store.bravesyntax.com and the products in each.
// Ebooks are live (lib/ebooks.ts). The other categories are listed as "coming soon" until they have products;
// physical goods (apparel, fashion) will also need shipping and an address step at checkout.
import { EBOOKS, type Ebook } from "@/lib/ebooks";

export type CategorySlug = "ebooks" | "apparel" | "fashion" | "crm";

export type Category = {
  slug: CategorySlug;
  name: string;
  blurb: string;
  /** lucide icon name, rendered by the store pages */
  icon: "BookOpen" | "Shirt" | "Gem" | "LayoutDashboard";
};

export const CATEGORIES: Category[] = [
  { slug: "ebooks", name: "Ebooks & guides", blurb: "Practical guides on freelancing and running a web business, with ready templates.", icon: "BookOpen" },
  { slug: "apparel", name: "Apparel", blurb: "T-shirts and hoodies for developers and creators.", icon: "Shirt" },
  { slug: "fashion", name: "Fashion & accessories", blurb: "Everyday accessories.", icon: "Gem" },
  { slug: "crm", name: "CRM & business software", blurb: "A CRM and ready-made tools for small businesses.", icon: "LayoutDashboard" },
];

export type Product = Ebook;

/** Every product, newest first. */
export const PRODUCTS: Product[] = [...EBOOKS];

export const productsIn = (slug: CategorySlug) => PRODUCTS.filter((p) => p.category === slug);
export const isLive = (slug: CategorySlug) => productsIn(slug).length > 0;
