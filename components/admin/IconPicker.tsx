"use client";

import { useState } from "react";

// Pick a preset SVG path or paste a custom one (icon picker on admin/services.php).
const ICON_OPTIONS: [string, string][] = [
  ["code", "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"],
  ["desktop", "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"],
  ["cart", "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"],
  ["globe", "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"],
  ["paint", "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"],
  ["layout", "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"],
  ["document", "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"],
  ["tag", "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"],
  ["image", "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"],
  ["terminal", "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"],
  ["phone", "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"],
  ["search", "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"],
  ["chart", "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"],
  ["mail", "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"],
];

export default function IconPicker({ defaultValue }: { defaultValue: string }) {
  const [icon, setIcon] = useState(defaultValue);
  return (
    <div>
      <span className="block text-xs font-mono text-zinc-400 mb-3">
        Icon <span className="text-zinc-600">(click to select)</span>
      </span>
      <div className="flex flex-wrap gap-2 mb-3">
        {ICON_OPTIONS.map(([name, path]) => (
          <button
            key={name}
            type="button"
            title={name}
            onClick={() => setIcon(path)}
            className={`w-10 h-10 bg-zinc-800/50 border rounded-lg flex items-center justify-center hover:border-brand/50 transition-all ${
              icon === path ? "border-brand bg-brand/10" : "border-zinc-700"
            }`}
          >
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
            </svg>
          </button>
        ))}
      </div>
      <input type="hidden" name="icon" value={icon} />
      <p className="text-[10px] font-mono text-zinc-600">Or paste a custom SVG path below:</p>
      <input
        type="text"
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        placeholder="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        aria-label="Custom SVG path"
        className="mt-2 w-full px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-brand transition-colors"
      />
    </div>
  );
}
