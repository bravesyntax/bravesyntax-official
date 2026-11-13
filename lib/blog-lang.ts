// Languages a blog post can be written in. A translation is a separate post linked to the original
// (blog_posts.translation_of), so each version has its own URL, SEO and publish state.

export type BlogLang = "en" | "hi";

export const BLOG_LANGS: Record<BlogLang, { label: string; native: string; ogLocale: string; readIn: string }> = {
  en: { label: "English", native: "English", ogLocale: "en_IN", readIn: "Read in English" },
  hi: { label: "Hindi", native: "हिंदी", ogLocale: "hi_IN", readIn: "हिंदी में पढ़ें" },
};

export const isBlogLang = (v: unknown): v is BlogLang => typeof v === "string" && v in BLOG_LANGS;

/** Page chrome around a post, in the post's language. */
export const POST_UI: Record<BlogLang, { back: string; minRead: (n: number) => string; onPage: string; ctaTitle: string; ctaText: string; ctaButton: string; related: string; keepReading: string }> = {
  en: {
    back: "Back to blog",
    minRead: (n) => `${n} min read`,
    onPage: "On this page",
    ctaTitle: "Need help with this?",
    ctaText: "Tell us about your project and we'll send a clear plan and a fixed quote.",
    ctaButton: "Start a project",
    related: "Related articles",
    keepReading: "Keep reading",
  },
  hi: {
    back: "ब्लॉग पर वापस",
    minRead: (n) => `${n} मिनट में पढ़ें`,
    onPage: "इस लेख में",
    ctaTitle: "इसमें मदद चाहिए?",
    ctaText: "अपने प्रोजेक्ट के बारे में बताइए, हम एक साफ़ प्लान और तय कीमत भेजेंगे।",
    ctaButton: "प्रोजेक्ट शुरू करें",
    related: "मिलते-जुलते लेख",
    keepReading: "और पढ़ें",
  },
};
