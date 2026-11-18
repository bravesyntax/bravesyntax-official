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
};

export const EBOOKS: Ebook[] = [
  {
    slug: "pehla-client",
    title: "Pehla Client",
    subtitle: "Web developers ke liye freelancing shuru karne ki step-by-step guide",
    price: 299,
    mrp: 499,
    pages: "80 pages",
    language: "Hinglish",
    fileEnv: "EBOOK_PEHLA_CLIENT_URL",
    fileName: "Pehla-Client-Brave-Syntax.pdf",
    audience: [
      "College students jo HTML, CSS, React ya Next.js seekh chuke hain",
      "Beginner developers jinke paas abhi koi client nahi hai",
      "Job karne wale jo weekends par side income chahte hain",
      "WordPress ya no-code tools se websites banane wale",
    ],
    outcomes: [
      "Ek clear service aur niche jo client ko turant samajh aaye",
      "Bina real client ke strong portfolio",
      "Sahi pricing aur 3-package price list",
      "Roz ka outreach system jisse clients milte rahein",
      "Call par deal close karna aur 50% advance lena",
      "Bina jhagde ke project delivery aur repeat clients",
    ],
    chapters: [
      { title: "Freelancing ka sach", desc: "Myths, job vs freelancing, aur shuru karne ke liye kitna aana chahiye." },
      { title: "Service aur niche", desc: "Kya bechna hai, kisko bechna hai, aur aapka one-line offer." },
      { title: "Bina client ke portfolio", desc: "3 demo projects, redesign trick aur case study format." },
      { title: "Pricing", desc: "Price nikaalne ka formula, 3 packages aur payment rules." },
      { title: "Client kahan milenge", desc: "Google Maps, WhatsApp, LinkedIn, Instagram, platforms aur referrals." },
      { title: "Deal close karna", desc: "Discovery questions, proposal, objections aur follow-up." },
      { title: "Project delivery", desc: "Scope, 5-step process, revisions, launch checklist aur handover." },
      { title: "1 se 10 clients", desc: "Testimonials, maintenance plans, upsell, referrals aur rates badhana." },
      { title: "Paisa, invoice aur tax", desc: "Payment lena, invoice, hisaab aur GST/income tax ki basic baatein." },
      { title: "30-din ka action plan", desc: "Week-by-week checklist jo aapko pehle client tak le jaaye." },
    ],
    bonuses: [
      "6 ready cold outreach messages (WhatsApp, email, LinkedIn)",
      "Project proposal template",
      "Invoice template",
      "Client onboarding questionnaire",
      "Simple project agreement",
      "Pricing calculator",
      "Free tools aur resources: 40+ clickable links (seekhna, design, hosting, invoice, tax)",
    ],
    faqs: [
      ["Ebook kis format mein milegi?", "PDF format mein. Payment ke turant baad download link is page par aur aapke email par mil jaayega. Ise phone, laptop ya tablet kahin bhi padh sakte ho."],
      ["Kya mujhe coding aani chahiye?", "Basic website banana aana chahiye. Ye book coding nahi, coding se paisa kamana sikhati hai."],
      ["Payment kaise hogi?", "Razorpay se: UPI, debit/credit card, net banking ya wallet. Payment poori tarah secure hai."],
      ["Download link kho gaya to?", "Purchase email mein link hamesha rehta hai. Phir bhi problem ho to support@bravesyntax.com par order ID ke saath email karein."],
      ["Kya income ki guarantee hai?", "Nahi. Results aapki mehnat, skill aur situation par depend karte hain. Book aapko ek tested process aur templates deti hai."],
    ],
  },
];

export const getEbook = (slug: string) => EBOOKS.find((e) => e.slug === slug);

/** Public URL of the store: the subdomain in production, /ebooks elsewhere. */
export const EBOOKS_URL = (process.env.NEXT_PUBLIC_EBOOKS_URL ?? "https://store.bravesyntax.com").replace(/\/$/, "");

/** How many times one purchase's link can be used. */
export const EBOOK_MAX_DOWNLOADS = 10;

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
