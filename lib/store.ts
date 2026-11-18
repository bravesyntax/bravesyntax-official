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
  { slug: "ebooks", name: "Ebooks & guides", blurb: "Freelancing aur web business ki practical guides, Hinglish mein, templates ke saath.", icon: "BookOpen" },
  { slug: "apparel", name: "Apparel", blurb: "Developers aur creators ke liye T-shirts aur hoodies.", icon: "Shirt" },
  { slug: "fashion", name: "Fashion & accessories", blurb: "Roz ke use ki accessories.", icon: "Gem" },
  { slug: "crm", name: "CRM & business software", blurb: "Small business ke liye CRM aur ready tools.", icon: "LayoutDashboard" },
];

export type Product = Ebook;

/** Every product, newest first. */
export const PRODUCTS: Product[] = [...EBOOKS];

export const productsIn = (slug: CategorySlug) => PRODUCTS.filter((p) => p.category === slug);
export const isLive = (slug: CategorySlug) => productsIn(slug).length > 0;
