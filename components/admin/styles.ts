// Tailwind class strings shared by server and client admin components (styles from admin/*.php).

export const inputCls =
  "w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-accent transition-colors";
export const labelCls = "block text-xs font-mono text-zinc-400 mb-2";
export const primaryBtn =
  "inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-light text-black font-mono font-semibold text-sm rounded-xl transition-all";
export const smallPrimaryBtn =
  "inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-light text-black font-mono font-semibold text-xs rounded-lg transition-all";

/** Square icon buttons for table row actions (edit / toggle / delete / view). */
const iconBtn = "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent transition-colors";
export const iconBtnEdit = `${iconBtn} text-zinc-400 hover:border-accent/30 hover:bg-accent/10 hover:text-accent`;
export const iconBtnToggle = `${iconBtn} text-zinc-400 hover:border-amber-400/30 hover:bg-amber-400/10 hover:text-amber-400`;
export const iconBtnDelete = `${iconBtn} text-zinc-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400`;
export const iconBtnView = `${iconBtn} text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white`;
