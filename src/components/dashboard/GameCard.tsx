"use client";

import Image from "next/image";
import {
  BookOpen,
  Gamepad2,
  Monitor,
  Pencil,
  Star,
  TrendingUp,
} from "lucide-react";
import {
  GAME_STATUS_META,
  type GameStatus,
  type UserGame,
} from "@/types/database";

interface GameCardProps {
  game: UserGame;
  onEdit: (game: UserGame) => void;
  onQuickStatusChange: (id: string, status: GameStatus) => void;
}

export function GameCard({
  game,
  onEdit,
  onQuickStatusChange,
}: GameCardProps) {
  const statusMeta = GAME_STATUS_META[game.status];
  const releaseYear = game.released_date ? game.released_date.slice(0, 4) : null;

  return (
    <article
      onClick={() => onEdit(game)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#111119] hover:border-violet-500/40 hover:bg-[#14141f] transition duration-200 cursor-pointer shadow-lg shadow-black/20"
    >
      {/* Portada */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900">
        {game.cover_url ? (
          <Image
            src={game.cover_url}
            alt={game.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950">
            <Gamepad2 className="h-10 w-10 text-zinc-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111119] via-[#111119]/25 to-transparent" />

        {/* Badge de Estado */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-md px-2.5 py-1 text-[11px] font-medium ${statusMeta.badgeClass}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
            {statusMeta.shortLabel}
          </span>
        </div>

        {/* Badge de Puntuación */}
        {game.rating !== null && (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-black/70 backdrop-blur-md px-2.5 py-1 text-xs font-mono font-semibold text-amber-300">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {Number(game.rating).toFixed(1)}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-zinc-100 group-hover:text-white line-clamp-1">
            {game.title}
          </h3>
          {releaseYear && (
            <span className="shrink-0 text-xs font-mono text-zinc-500 mt-0.5">
              {releaseYear}
            </span>
          )}
        </div>

        {/* Plataforma y Progreso */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/90 px-2 py-0.5 text-[11px] text-zinc-300">
            <Monitor className="h-3 w-3 text-zinc-500" />
            {game.platform}
          </span>
          {game.progress && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-200">
              <TrendingUp className="h-3 w-3 text-cyan-400" />
              {game.progress}
            </span>
          )}
        </div>

        {/* Bitácora snippet */}
        {game.notes ? (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            <BookOpen className="h-3.5 w-3.5 shrink-0 mt-0.5 text-zinc-600" />
            <span>{game.notes}</span>
          </p>
        ) : (
          <p className="mt-3 text-xs text-zinc-600 italic">
            Sin notas en la bitácora todavía.
          </p>
        )}

        {/* Footer rápido */}
        <div
          className="mt-auto pt-4 flex items-center justify-between gap-2 border-t border-zinc-800/60"
          onClick={(e) => e.stopPropagation()}
        >
          <select
            aria-label={`Cambiar estado de ${game.title}`}
            value={game.status}
            onChange={(e) =>
              onQuickStatusChange(game.id, e.target.value as GameStatus)
            }
            className="rounded-lg border border-zinc-800 bg-[#0b0b11] px-2 py-1 text-[11px] text-zinc-300 focus:border-violet-500/60 focus:outline-none cursor-pointer"
          >
            <option value="playing">Jugando</option>
            <option value="completed">Completado</option>
            <option value="pending">Pendiente</option>
            <option value="dropped">Abandonado</option>
          </select>

          <button
            type="button"
            onClick={() => onEdit(game)}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100 transition cursor-pointer"
          >
            <Pencil className="h-3 w-3" />
            Editar
          </button>
        </div>
      </div>
    </article>
  );
}
