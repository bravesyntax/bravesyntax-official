import "server-only";
import sanitizeHtml from "sanitize-html";

// Admin-authored HTML (blog posts, job descriptions, legal pages) is rendered as-is, so it is filtered on the
// way out: formatting, links, images, tables and code survive; scripts, event handlers, iframes, forms and
// javascript: URLs don't. This limits the damage if an admin account or the database is ever compromised.

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "blockquote", "pre", "code", "span", "div",
    "strong", "b", "em", "i", "u", "s", "mark", "small", "sub", "sup",
    "ul", "ol", "li", "dl", "dt", "dd", "a", "img", "figure", "figcaption", "video",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    // Videos from the media library: no autoplay with sound, nothing that runs script.
    video: ["src", "poster", "controls", "preload", "playsinline", "muted", "loop", "width", "height"],
    th: ["colspan", "rowspan", "scope"],
    td: ["colspan", "rowspan"],
    "*": ["id", "class"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https", "data"], video: ["https"] },
  allowProtocolRelative: false,
  transformTags: {
    // External links open safely in a new tab.
    a: (tagName, attribs) => {
      const external = /^https?:\/\//i.test(attribs.href ?? "") && !/^https?:\/\/(www\.)?bravesyntax\.com/i.test(attribs.href ?? "");
      return { tagName, attribs: external ? { ...attribs, target: "_blank", rel: "noopener noreferrer" } : attribs };
    },
  },
};

export const sanitizeRichHtml = (html: string | null | undefined) => sanitizeHtml(html ?? "", OPTIONS);
