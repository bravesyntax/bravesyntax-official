"use client";

import { useRef, useState, type ReactNode } from "react";
import { addBlogCategory } from "@/app/admin/(panel)/blog/actions";
import { inputCls, labelCls } from "./styles";

// Interactive parts of the blog post editor (the inline scripts in admin/blog.php).

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");

/** Title + slug (with children beside the slug); the slug follows the title until it is edited by hand. */
export function TitleSlugFields({
  title,
  slug,
  children,
}: {
  title: string;
  slug: string;
  children: ReactNode;
}) {
  const [slugValue, setSlugValue] = useState(slug);
  const manual = useRef(!!slug);
  return (
    <>
      <div>
        <label htmlFor="postTitle" className={labelCls}>
          Post Title <span className="text-emerald-400">*</span>
        </label>
        <input
          id="postTitle"
          type="text"
          name="title"
          required
          defaultValue={title}
          placeholder="e.g. Why Your Business Needs a Custom Website"
          onChange={(e) =>
            !manual.current && setSlugValue(slugify(e.target.value))
          }
          className={`${inputCls} !py-3 text-lg`}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="postSlug" className={labelCls}>
            URL Slug{" "}
            <span className="text-zinc-600">(auto-generated from title)</span>
          </label>
          <div className="flex items-center">
            <span className="px-3 py-2.5 bg-zinc-800 border border-r-0 border-zinc-700 rounded-l-xl text-xs font-mono text-zinc-500">
              /blog/
            </span>
            <input
              id="postSlug"
              type="text"
              name="slug"
              value={slugValue}
              placeholder="my-post-title"
              onChange={(e) => {
                manual.current = true;
                setSlugValue(e.target.value);
              }}
              className={`${inputCls} !rounded-l-none !px-3`}
            />
          </div>
        </div>
        {children}
      </div>
    </>
  );
}

/** Category select plus "type a new category and press +". */
export function CategoryPicker({
  categories,
  current,
}: {
  categories: { slug: string; label: string }[];
  current: string;
}) {
  const [cats, setCats] = useState(categories);
  const [value, setValue] = useState(current);
  const [label, setLabel] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function add() {
    const name = label.trim();
    if (!name) return setMsg({ text: "Enter a name first.", ok: false });
    if (!slugify(name))
      return setMsg({ text: "Use letters or numbers.", ok: false });
    setMsg({ text: "Saving…", ok: true });
    const res = await addBlogCategory(name);
    if (!res.ok) return setMsg({ text: res.error, ok: false });
    if (!res.existed)
      setCats((c) => [...c, { slug: res.slug, label: res.label }]);
    setValue(res.slug);
    setLabel("");
    setMsg({
      text: res.existed ? "Already exists — selected." : "Added ✓",
      ok: true,
    });
  }

  const options = cats.some((c) => c.slug === value)
    ? cats
    : [...cats, { slug: value, label: value }];
  return (
    <div>
      <label htmlFor="categorySelect" className={labelCls}>
        Category
      </label>
      <select
        id="categorySelect"
        name="category"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={inputCls}
      >
        {options.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.label}
          </option>
        ))}
      </select>
      <div className="mt-2 flex gap-2 items-center">
        <input
          type="text"
          value={label}
          aria-label="New category name"
          placeholder="Type new category name & press ＋"
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className={`${inputCls} !py-2 flex-1 placeholder-zinc-600`}
        />
        <button
          type="button"
          onClick={add}
          title="Add category"
          className="px-3 py-2 bg-accent hover:bg-accent-light text-black font-mono font-bold text-sm rounded-xl transition-all flex-shrink-0"
        >
          ＋
        </button>
      </div>
      <p className="mt-1 text-[10px] font-mono text-zinc-600">
        Slug: <span className="text-zinc-500">{slugify(label) || "—"}</span>
        {msg && (
          <span
            className={`ml-2 ${msg.ok ? "text-emerald-400" : "text-red-400"}`}
          >
            {msg.text}
          </span>
        )}
      </p>
    </div>
  );
}

const TAGS: [string, string][] = [
  ["h2", "H2"],
  ["h3", "H3"],
  ["p", "P"],
  ["strong", "Bold"],
  ["a", "Link"],
  ["ul", "UL"],
  ["code", "Code"],
];

/** HTML content textarea with tag-insert buttons. */
export function ContentEditor({ content }: { content: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function insert(tag: string) {
    const t = ref.current!;
    const { selectionStart: s, selectionEnd: e, value } = t;
    const sel = value.slice(s, e);
    const html =
      tag === "a"
        ? `<a href="">${sel}</a>`
        : tag === "ul"
          ? `<ul>\n<li>${sel}</li>\n</ul>`
          : `<${tag}>${sel}</${tag}>`;
    t.value = value.slice(0, s) + html + value.slice(e);
    t.focus();
  }

  return (
    <div>
      <label htmlFor="postContent" className={labelCls}>
        Content <span className="text-emerald-400">*</span>{" "}
        <span className="text-zinc-600">
          (HTML supported: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;strong&gt;,
          &lt;em&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;a&gt;, &lt;code&gt;)
        </span>
      </label>
      <div className="flex gap-2 mb-2">
        {TAGS.map(([tag, label]) => (
          <button
            key={tag}
            type="button"
            onClick={() => insert(tag)}
            className="px-2 py-1 text-[10px] font-mono bg-zinc-800 border border-zinc-700 rounded text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            {label}
          </button>
        ))}
      </div>
      <textarea
        ref={ref}
        id="postContent"
        name="content"
        rows={16}
        required
        defaultValue={content}
        placeholder="Write your blog post content here..."
        className={`${inputCls} !py-3 resize-y leading-relaxed`}
      />
    </div>
  );
}
