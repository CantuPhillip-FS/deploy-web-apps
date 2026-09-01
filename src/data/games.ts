export type Game = {
  id: string;
  name: string;
  tagline: string;
  blurb: string;
  year: number;
  note?: string;
  tech: string[];
  /** Official site — the card links here. */
  url: string;
  playUrl?: string;
  /** Cover panel background, as an oklch() color. */
  coverBg?: string;
};

/** Newest first. The first entry is featured on /games. */
export const GAMES: Game[] = [
  {
    id: "baaalance",
    name: "Baaalance",
    tagline: "Stack panicking sheep as high as possible.",
    blurb:
      "A free browser physics game: one tiny plateau, one sheep at a time, and a wind that always warns you first. Lose three and the flock scatters. Every day has its own board.",
    year: 2026,
    note: "Browser",
    tech: ["Godot", "TypeScript", "Cloudflare Workers", "D1"],
    url: "https://baaalance.thereisphil.workers.dev/",
    playUrl: "https://philtheotaku.itch.io/baaalance",
    coverBg: "oklch(0.16 0.028 145)",
  },
];
