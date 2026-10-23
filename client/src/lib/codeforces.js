/** Codeforces rank / rating helpers for a consistent CP UI. */

export const CF_RANKS = [
  { name: "legendary grandmaster", min: 3000, color: "#AA0000", text: "text-red-700 dark:text-red-500" },
  { name: "international grandmaster", min: 2600, color: "#FF0000", text: "text-red-600 dark:text-red-400" },
  { name: "grandmaster", min: 2400, color: "#FF0000", text: "text-red-500 dark:text-red-400" },
  { name: "international master", min: 2300, color: "#FF8C00", text: "text-orange-500 dark:text-orange-400" },
  { name: "master", min: 2100, color: "#FF8C00", text: "text-orange-500 dark:text-orange-400" },
  { name: "candidate master", min: 1900, color: "#AA00AA", text: "text-fuchsia-600 dark:text-fuchsia-400" },
  { name: "expert", min: 1600, color: "#0000FF", text: "text-blue-600 dark:text-blue-400" },
  { name: "specialist", min: 1400, color: "#03A89E", text: "text-cyan-600 dark:text-cyan-400" },
  { name: "pupil", min: 1200, color: "#008000", text: "text-emerald-600 dark:text-emerald-400" },
  { name: "newbie", min: 0, color: "#808080", text: "text-slate-500 dark:text-slate-400" },
];

export function getRatingColorClass(rating) {
  if (typeof rating !== "number" || Number.isNaN(rating)) {
    return "text-slate-500 dark:text-slate-400";
  }
  for (const rank of CF_RANKS) {
    if (rating >= rank.min) return rank.text;
  }
  return "text-slate-500 dark:text-slate-400";
}

export function getRankFromRating(rating) {
  if (typeof rating !== "number") return "Unrated";
  for (const rank of CF_RANKS) {
    if (rating >= rank.min) {
      return rank.name.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  return "Newbie";
}

export function formatRatingDelta(delta) {
  if (typeof delta !== "number" || delta === 0) return "0";
  return delta > 0 ? `+${delta}` : `${delta}`;
}

export function ratingDeltaClass(delta) {
  if (typeof delta !== "number" || delta === 0) return "text-slate-500";
  return delta > 0
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400";
}
