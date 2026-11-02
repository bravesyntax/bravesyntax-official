"use client";

import { useRef, useState } from "react";
import { inputCls, labelCls } from "./styles";

// Interactive bits of the location manager (inline scripts in admin/location.php).

/** City name + slug; the slug follows the name until edited, with a live URL preview. */
export function CityNameSlug({ name, slug }: { name: string; slug: string }) {
  const [slugValue, setSlugValue] = useState(slug);
  const manual = useRef(!!slug);
  return (
    <>
      <div>
        <label htmlFor="city_name" className={labelCls}>
          City Name <span className="text-emerald-400">*</span>
        </label>
        <input
          id="city_name"
          type="text"
          name="name"
          required
          defaultValue={name}
          placeholder="e.g. Delhi"
          onChange={(e) =>
            !manual.current &&
            setSlugValue(
              e.target.value
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, ""),
            )
          }
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="city_slug" className={labelCls}>
          URL Slug <span className="text-emerald-400">*</span>
        </label>
        <input
          id="city_slug"
          type="text"
          name="slug"
          required
          value={slugValue}
          placeholder="delhi"
          onChange={(e) => {
            manual.current = true;
            setSlugValue(e.target.value);
          }}
          className={inputCls}
        />
        <div className="mt-1 text-[11px] font-mono text-zinc-500">
          bravesyntax.com/<span className="text-emerald-400">{slugValue || "..."}</span>
        </div>
      </div>
    </>
  );
}

const SAMPLE_FEATURES = [
  { icon: "code", title: "Feature One", desc: "Description of this feature" },
  { icon: "palette", title: "Feature Two", desc: "Another feature description" },
  { icon: "rocket", title: "Feature Three", desc: "Third feature description" },
  { icon: "lock", title: "Feature Four", desc: "Fourth feature" },
  { icon: "chart", title: "Feature Five", desc: "Fifth feature" },
  { icon: "handshake", title: "Feature Six", desc: "Sixth feature" },
];

/** Features JSON textarea with an "Insert sample JSON" helper. */
export function FeaturesJson({ value }: { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <div>
      <label htmlFor="features_json" className={labelCls}>
        Features JSON <span className="text-zinc-600">(array of {"{icon, title, desc}"})</span>
      </label>
      <textarea
        ref={ref}
        id="features_json"
        name="features_json"
        rows={8}
        defaultValue={value}
        placeholder='[{"icon":"code","title":"Feature","desc":"Description"}]'
        className={`${inputCls} resize-y text-xs leading-relaxed`}
      />
      <div className="mt-1.5 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[10px] font-mono text-zinc-600">Valid JSON array of {"{icon, title, desc}"}. Icons: code, palette, search, smartphone, zap, rocket, lock, chart, cart, globe, shield, support, megaphone, layout. Leave empty for default cards.</p>
        <button
          type="button"
          onClick={() => {
            if (ref.current) ref.current.value = JSON.stringify(SAMPLE_FEATURES, null, 2);
          }}
          className="px-2 py-1 text-[10px] font-mono bg-zinc-800 border border-zinc-700 rounded text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
        >
          Insert sample JSON
        </button>
      </div>
    </div>
  );
}
