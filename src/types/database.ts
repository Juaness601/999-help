export type GameStatus = "playing" | "completed" | "pending" | "dropped";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserGame {
  id: string;
  user_id: string;
  rawg_id: number;
  slug: string;
  title: string;
  cover_url: string | null;
  released_date: string | null;
  genres: string[];
  available_platforms: string[];
  status: GameStatus;
  platform: string;
  progress: string | null;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const GAME_STATUS_META: Record<
  GameStatus,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  playing: {
    label: "Jugando / Iniciado",
    shortLabel: "Jugando",
    badgeClass:
      "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    dotClass: "bg-cyan-400",
  },
  completed: {
    label: "Completado",
    shortLabel: "Completado",
    badgeClass:
      "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dotClass: "bg-emerald-400",
  },
  pending: {
    label: "Pendiente",
    shortLabel: "Pendiente",
    badgeClass:
      "bg-violet-500/15 text-violet-300 border-violet-500/30",
    dotClass: "bg-violet-400",
  },
  dropped: {
    label: "Abandonado (Lo dejé)",
    shortLabel: "Abandonado",
    badgeClass:
      "bg-rose-500/15 text-rose-300 border-rose-500/30",
    dotClass: "bg-rose-400",
  },
};

export const PLATFORM_PRESETS = [
  "PC (Steam)",
  "PC (Epic Games)",
  "PC (Game Pass)",
  "PC (GOG / Otros)",
  "PlayStation 5",
  "PlayStation 4",
  "Xbox Series X|S",
  "Xbox One",
  "Nintendo Switch",
  "Steam Deck / Portátil",
  "Móvil (iOS / Android)",
] as const;
