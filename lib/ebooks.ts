// Ebooks sold on store.bravesyntax.com. Prices are in rupees here and converted to paise for Razorpay.
// The PDF itself lives in the PRIVATE Blob store (the RESUME_BLOB one): upload it there and put its URL in the
// env var named by `fileEnv`, so the file is never reachable without a paid download token.

export type Ebook = {
  slug: string;
  title: string;
  subtitle: string;
  /** Selling price in rupees. */
  price: number;
  /** Struck-through "was" price in rupees, or undefined for none. */
  mrp?: number;
  pages: string;
  language: string;
  /** Env var holding the private Blob URL of the PDF. */
  fileEnv: string;
  /** File name the buyer's download is saved as. */
  fileName: string;
  audience: string[];
  outcomes: string[];
  chapters: { title: string; desc: string }[];
  bonuses: string[];
  faqs: [q: string, a: string][];
  /** Store category this product is listed under (lib/store.ts). */
  category: "ebooks";
  /** Front cover image (public/), shown as the product thumbnail and 3D mockup. */
  cover: string;
  /** Real pages from the book, shown as a preview gallery. */
  previews: { src: string; caption: string }[];
  /** Big numbers for the stats strip. */
  stats: [value: string, label: string][];
  /** Problems the book solves, in the book's own terms. */
  painPoints: string[];
  /** The step-by-step path the book takes the reader along, with the chapter for each step. */
  journey: [step: string, chapter: string][];
  /** Who it is not for (honest fit). */
  notFor: string[];
};

export const EBOOKS: Ebook[] = [
  {
    slug: "pehla-client",
    title: "Pehla Client",
    subtitle: "A step-by-step guide for web developers to land their first freelance client",
    price: 299,
    mrp: 499,
    pages: "80 pages",
    language: "Hinglish",
    fileEnv: "EBOOK_PEHLA_CLIENT_URL",
    fileName: "Pehla-Client-Brave-Syntax.pdf",
    audience: [
      "Students who have learned HTML, CSS, React or Next.js",
      "Beginner developers who don't have a client yet",
      "People with a job who want a side income on weekends",
      "Anyone building websites with WordPress or no-code tools",
    ],
    outcomes: [
      "A clear service and niche that clients understand instantly",
      "A strong portfolio, even without real clients",
      "The right pricing and a 3-package price list",
      "A daily outreach system that keeps clients coming",
      "Closing deals on calls and taking a 50% advance",
      "Delivering projects without disputes, and getting repeat clients",
    ],
    chapters: [
      { title: "The truth about freelancing", desc: "Myths, job vs freelancing, and how much you need to know to start." },
      { title: "Your service and niche", desc: "What to sell, who to sell it to, and your one-line offer." },
      { title: "A portfolio without clients", desc: "3 demo projects, the redesign trick and a case-study format." },
      { title: "Pricing", desc: "A formula to set your price, 3 packages and payment rules." },
      { title: "Where to find clients", desc: "Google Maps, WhatsApp, LinkedIn, Instagram, platforms and referrals." },
      { title: "Closing the deal", desc: "Discovery questions, proposals, objections and follow-ups." },
      { title: "Delivering the project", desc: "Scope, a 5-step process, revisions, launch checklist and handover." },
      { title: "From 1 to 10 clients", desc: "Testimonials, maintenance plans, upsells, referrals and raising rates." },
      { title: "Money, invoices and tax", desc: "Getting paid, invoicing, bookkeeping and GST/income tax basics." },
      { title: "30-day action plan", desc: "A week-by-week checklist that takes you to your first client." },
    ],
    bonuses: [
      "6 ready cold outreach messages (WhatsApp, email, LinkedIn)",
      "Project proposal template",
      "Invoice template",
      "Client onboarding questionnaire",
      "Simple project agreement",
      "Pricing calculator",
      "Free tools and resources: 40+ clickable links (learning, design, hosting, invoicing, tax)",
    ],
    faqs: [
      ["What format is the ebook in?", "PDF. Right after payment you get a download link on this page and by email. Read it on your phone, laptop or tablet."],
      ["What language is it written in?", "Hinglish (Hindi in Roman script, mixed with English), in simple, everyday words."],
      ["Do I need to know how to code?", "You should be able to build a basic website. The book doesn't teach coding; it teaches how to earn from it."],
      ["How do I pay?", "Through Razorpay: UPI, debit/credit card, net banking or wallets. Payments are secure."],
      ["What if I lose the download link?", "The link stays in your purchase email. If you still have trouble, email support@bravesyntax.com with your order ID."],
      ["Is income guaranteed?", "No. Results depend on your effort, skills and situation. The book gives you a tested process and templates."],
      ["Can I get a refund?", "It's a digital product, so there are no refunds after download. Look through the 8 real pages above before you buy."],
    ],
    category: "ebooks",
    cover: "/store/pehla-client/cover.webp",
    previews: [
      { src: "/store/pehla-client/preview-contents.webp", caption: "Contents: 9 chapters, 30-day plan, bonus" },
      { src: "/store/pehla-client/preview-chapter.webp", caption: "Every chapter opens like this" },
      { src: "/store/pehla-client/preview-myths.webp", caption: "4 freelancing myths vs the truth" },
      { src: "/store/pehla-client/preview-price-range.webp", caption: "What each service sells for" },
      { src: "/store/pehla-client/preview-packages.webp", caption: "3-package pricing" },
      { src: "/store/pehla-client/preview-message.webp", caption: "How to write to a client" },
      { src: "/store/pehla-client/preview-proposal.webp", caption: "Ready project proposal template" },
      { src: "/store/pehla-client/preview-resources.webp", caption: "40+ free tools and links" },
    ],
    stats: [
      ["80", "pages"],
      ["9", "chapters"],
      ["38", "visuals"],
      ["6", "templates"],
      ["40+", "free tools"],
    ],
    painPoints: [
      "You can code, but you haven't landed a single paying client",
      "Your portfolio has no real projects to show",
      "You don't know what to charge, and cheap work has worn you out",
      "You've sent proposals on platforms and barely heard back",
      "You get stuck when talking to a client on a call",
    ],
    journey: [
      ["Pick your service and niche", "Ch 2"],
      ["Build a portfolio without clients", "Ch 3"],
      ["Set your price", "Ch 4"],
      ["Find clients", "Ch 5"],
      ["Close the deal", "Ch 6"],
      ["Deliver the project", "Ch 7"],
      ["Get referrals and repeat clients", "Ch 8"],
      ["Handle money and tax", "Ch 9"],
    ],
    notFor: [
      "You can't code at all yet: learn the basics for 2-3 months first",
      "You want instant income without putting in the work",
    ],
  },
];

export const getEbook = (slug: string) => EBOOKS.find((e) => e.slug === slug);

/** Public URL of the store: the subdomain in production, /ebooks elsewhere. */
export const EBOOKS_URL = (process.env.NEXT_PUBLIC_EBOOKS_URL ?? "https://store.bravesyntax.com").replace(/\/$/, "");

/** How many times one purchase's link can be used. */
export const EBOOK_MAX_DOWNLOADS = 10;

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
