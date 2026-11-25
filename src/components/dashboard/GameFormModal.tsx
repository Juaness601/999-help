"use client";

import { useState, useTransition, type FormEvent } from "react";
import Image from "next/image";
import {
  BookOpen,
  Gamepad2,
  Loader2,
  Monitor,
  Save,
  Star,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import {
  GAME_STATUS_META,
  PLATFORM_PRESETS,
  type GameStatus,
  type UserGame,
} from "@/types/database";
import type { RawgSearchGame } from "@/types/rawg";
import {
  addGameToLibrary,
  deleteLibraryGame,
  updateLibraryGame,
} from "@/app/actions/games";

interface GameFormModalProps {
  mode: "add" | "edit";
  rawgGame?: RawgSearchGame;
  existingGame?: UserGame;
  onClose: () => void;
  onSaved: (game: UserGame, isNew: boolean) => void;
  onDeleted?: (id: string) => void;
}

const STATUS_OPTIONS: GameStatus[] = [
  "playing",
  "completed",
  "pending",
  "dropped",
];

function inferDefaultPlatform(availablePlatforms: string[]): string {
  const joined = availablePlatforms.join(" ").toLowerCase();
  if (joined.includes("pc")) return "PC (Steam)";
  if (joined.includes("playstation 5")) return "PlayStation 5";
  if (joined.includes("playstation 4")) return "PlayStation 4";
  if (joined.includes("switch")) return "Nintendo Switch";
  if (joined.includes("xbox")) return "Xbox Series X|S";
  if (availablePlatforms[0]) return availablePlatforms[0];
  return "PC (Steam)";
}

export function GameFormModal({
  mode,
  rawgGame,
  existingGame,
  onClose,
  onSaved,
  onDeleted,
}: GameFormModalProps) {
  const isEdit = mode === "edit" && Boolean(existingGame);

  const title = isEdit ? existingGame!.title : rawgGame!.title;
  const coverUrl = isEdit ? existingGame!.cover_url : rawgGame!.cover_url;
  const releasedDate = isEdit
    ? existingGame!.released_date
    : rawgGame!.released_date;
  const genres = isEdit ? existingGame!.genres : rawgGame!.genres;
  const availablePlatforms = isEdit
    ? existingGame!.available_platforms
    : rawgGame!.available_platforms;

  const [status, setStatus] = useState<GameStatus>(
    isEdit ? existingGame!.status : "playing"
  );
  const [platform, setPlatform] = useState<string>(
    isEdit ? existingGame!.platform : inferDefaultPlatform(availablePlatforms)
  );
  const [progress, setProgress] = useState<string>(
    isEdit ? existingGame!.progress || "" : ""
  );
  const [ratingInput, setRatingInput] = useState<string>(
    isEdit && existingGame!.rating !== null
      ? Number(existingGame!.rating).toFixed(1)
      : ""
  );
  const [notes, setNotes] = useState<string>(
    isEdit ? existingGame!.notes || "" : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    let parsedRating: number | null = null;
    if (ratingInput.trim() !== "") {
      const normalized = Number(ratingInput.replace(",", "."));
      if (Number.isNaN(normalized) || normalized < 1 || normalized > 10) {
        setError("La puntuación debe ser un número entre 1.0 y 10.0.");
        return;
      }
      parsedRating = Math.round(normalized * 10) / 10;
    }

    startTransition(async () => {
      if (isEdit && existingGame) {
        const res = await updateLibraryGame(existingGame.id, {
          status,
          platform,
          progress: progress || null,
          rating: parsedRating,
          notes: notes || null,
        });
        if (!res.success || !res.data) {
          setError(res.error || "No se pudo actualizar el juego.");
          return;
        }
        onSaved(res.data, false);
        onClose();
      } else if (rawgGame) {
        const res = await addGameToLibrary({
          rawg_id: rawgGame.rawg_id,
          slug: rawgGame.slug,
          title: rawgGame.title,
          cover_url: rawgGame.cover_url,
          released_date: rawgGame.released_date,
          genres: rawgGame.genres,
          available_platforms: rawgGame.available_platforms,
          status,
          platform,
          progress: progress || null,
          rating: parsedRating,
          notes: notes || null,
        });
        if (!res.success || !res.data) {
          setError(res.error || "No se pudo agregar el juego.");
          return;
        }
        onSaved(res.data, true);
        onClose();
      }
    });
  };

  const handleDelete = () => {
    if (!existingGame) return;
    startTransition(async () => {
      const res = await deleteLibraryGame(existingGame.id);
      if (!res.success) {
        setError(res.error || "No se pudo eliminar el juego.");
        return;
      }
      onDeleted?.(existingGame.id);
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-[#111119] shadow-2xl">
        {/* Cabecera con carátula */}
        <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover opacity-55"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-950/60 to-zinc-950">
              <Gamepad2 className="h-12 w-12 text-zinc-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111119] via-[#111119]/60 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 p-2 text-zinc-300 hover:text-white transition cursor-pointer"
            aria-label="Cerrar ventana"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {releasedDate && (
                <span className="rounded-md bg-black/60 border border-white/10 px-2 py-0.5 text-[11px] font-mono text-zinc-300">
                  {releasedDate.slice(0, 4)}
                </span>
              )}
              {genres.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="rounded-md bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 text-[11px] text-violet-200"
                >
                  {g}
                </span>
              ))}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {title}
            </h2>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          {/* Estado */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
              Estado
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const meta = GAME_STATUS_META[opt];
                const active = status === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStatus(opt)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition cursor-pointer ${
                      active
                        ? `${meta.badgeClass} ring-1 ring-inset ring-white/15`
                        : "border-zinc-800 bg-[#0b0b11] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        active ? meta.dotClass : "bg-zinc-600"
                      }`}
                    />
                    {meta.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plataforma */}
          <div>
            <label
              htmlFor="platform"
              className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2"
            >
              <Monitor className="h-3.5 w-3.5 text-zinc-500" />
              Plataforma
            </label>
            <input
              id="platform"
              type="text"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="Ej. PC (Steam), PlayStation 5, Nintendo Switch..."
              required
              className="w-full rounded-xl border border-zinc-800 bg-[#0b0b11] px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/70 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PLATFORM_PRESETS.slice(0, 8).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPlatform(preset)}
                  className={`rounded-lg border px-2 py-1 text-[11px] transition cursor-pointer ${
                    platform === preset
                      ? "border-violet-500/50 bg-violet-500/15 text-violet-200"
                      : "border-zinc-800/90 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Progreso + Puntuación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="progress"
                className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2"
              >
                <TrendingUp className="h-3.5 w-3.5 text-zinc-500" />
                Progreso (opcional)
              </label>
              <input
                id="progress"
                type="text"
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                placeholder='Ej. "Capítulo 4", "60%", "42h"'
                maxLength={60}
                className="w-full rounded-xl border border-zinc-800 bg-[#0b0b11] px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/70 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition"
              />
            </div>

            <div>
              <label
                htmlFor="rating"
                className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-400" />
                  Puntuación (1.0 – 10.0)
                </span>
                {ratingInput && (
                  <button
                    type="button"
                    onClick={() => setRatingInput("")}
                    className="text-[11px] normal-case text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    Limpiar
                  </button>
                )}
              </label>
              <div className="relative">
                <input
                  id="rating"
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={ratingInput}
                  onChange={(e) => setRatingInput(e.target.value)}
                  placeholder="Ej. 8.5 o 9.0"
                  className="w-full rounded-xl border border-zinc-800 bg-[#0b0b11] px-3.5 py-2.5 pr-12 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/70 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition"
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">
                  / 10
                </span>
              </div>
            </div>
          </div>

          {/* Bitácora / Comentarios */}
          <div>
            <label
              htmlFor="notes"
              className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2"
            >
              <BookOpen className="h-3.5 w-3.5 text-zinc-500" />
              Bitácora / Comentarios
            </label>
            <textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escribe tus notas personales, mini reseña, recordatorio de dónde quedaste o por qué decidiste dejarlo..."
              className="w-full rounded-xl border border-zinc-800 bg-[#0b0b11] px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/70 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition resize-y"
            />
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
            {isEdit ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-3.5 py-2 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    Confirmar eliminación
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-xl px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 px-3.5 py-2 text-xs font-medium text-rose-300 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.28)] transition cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isEdit ? "Guardar cambios" : "Agregar a mi biblioteca"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
