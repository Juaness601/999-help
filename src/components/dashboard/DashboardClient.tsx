"use client";

import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Filter,
  Gamepad2,
  Library,
  LogOut,
  Play,
  Plus,
  Search,
  Star,
  Trophy,
  X,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { quickUpdateGameStatus } from "@/app/actions/games";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { GameCard } from "@/components/dashboard/GameCard";
import { GameFormModal } from "@/components/dashboard/GameFormModal";
import type { GameStatus, UserGame } from "@/types/database";
import type { RawgSearchGame } from "@/types/rawg";

interface DashboardClientProps {
  username: string;
  initialGames: UserGame[];
}

type StatusFilter = "all" | GameStatus;
type SortOption = "updated" | "rating" | "title";

const TABS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "playing", label: "Jugando" },
  { id: "completed", label: "Completados" },
  { id: "pending", label: "Pendientes" },
  { id: "dropped", label: "Abandonados" },
];

export function DashboardClient({
  username,
  initialGames,
}: DashboardClientProps) {
  const [games, setGames] = useState<UserGame[]>(initialGames);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [localQuery, setLocalQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("updated");

  const [addingGame, setAddingGame] = useState<RawgSearchGame | null>(null);
  const [editingGame, setEditingGame] = useState<UserGame | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const globalSearchInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast((current) => (current === message ? null : current));
    }, 3000);
  };

  // Mapa rápido por rawg_id para saber qué resultados de RAWG ya están guardados
  const libraryByRawgId = useMemo(() => {
    const map = new Map<number, UserGame>();
    for (const g of games) {
      map.set(g.rawg_id, g);
    }
    return map;
  }, [games]);

  // Contadores y métricas rápidas
  const stats = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: games.length,
      playing: 0,
      completed: 0,
      pending: 0,
      dropped: 0,
    };

    let ratingSum = 0;
    let ratedCount = 0;

    for (const g of games) {
      counts[g.status] += 1;
      if (g.rating !== null && !Number.isNaN(Number(g.rating))) {
        ratingSum += Number(g.rating);
        ratedCount += 1;
      }
    }

    const averageRating = ratedCount > 0 ? ratingSum / ratedCount : null;
    const completionRate =
      games.length > 0 ? Math.round((counts.completed / games.length) * 100) : 0;

    return { counts, averageRating, ratedCount, completionRate };
  }, [games]);

  // Filtrado y ordenamiento local de la biblioteca
  const filteredGames = useMemo(() => {
    const q = localQuery.trim().toLowerCase();

    return games
      .filter((g) => {
        if (statusFilter !== "all" && g.status !== statusFilter) return false;
        if (!q) return true;
        return (
          g.title.toLowerCase().includes(q) ||
          g.platform.toLowerCase().includes(q) ||
          (g.notes || "").toLowerCase().includes(q) ||
          (g.progress || "").toLowerCase().includes(q) ||
          g.genres.some((genre) => genre.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === "rating") {
          const ra = a.rating !== null ? Number(a.rating) : -1;
          const rb = b.rating !== null ? Number(b.rating) : -1;
          if (rb !== ra) return rb - ra;
        }
        if (sortBy === "title") {
          return a.title.localeCompare(b.title);
        }
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      });
  }, [games, statusFilter, localQuery, sortBy]);

  const handleSaved = (savedGame: UserGame, isNew: boolean) => {
    setGames((prev) => {
      if (isNew) {
        return [savedGame, ...prev];
      }
      return prev.map((g) => (g.id === savedGame.id ? savedGame : g));
    });
    showToast(
      isNew
        ? `"${savedGame.title}" agregado a tu biblioteca.`
        : `"${savedGame.title}" actualizado.`
    );
  };

  const handleDeleted = (id: string) => {
    const removed = games.find((g) => g.id === id);
    setGames((prev) => prev.filter((g) => g.id !== id));
    if (removed) {
      showToast(`"${removed.title}" eliminado de tu biblioteca.`);
    }
  };

  const handleQuickStatusChange = async (id: string, nextStatus: GameStatus) => {
    const previous = games;
    setGames((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, status: nextStatus, updated_at: new Date().toISOString() }
          : g
      )
    );

    const res = await quickUpdateGameStatus(id, nextStatus);
    if (!res.success || !res.data) {
      setGames(previous);
      showToast(res.error || "No se pudo actualizar el estado.");
    } else {
      setGames((prev) => prev.map((g) => (g.id === id ? res.data! : g)));
    }
  };

  return (
    <div className="min-h-screen bg-[#09090d] text-zinc-100">
      {/* Navbar superior */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#09090d]/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-cyan-500/20 border border-violet-500/30">
                <Gamepad2 className="h-5 w-5 text-violet-300" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white">
                  999<span className="text-violet-400">help</span>
                </span>
              </div>
            </div>

            {/* Perfil móvil */}
            <div className="flex md:hidden items-center gap-2">
              <span className="rounded-lg border border-zinc-800 bg-zinc-900/90 px-2.5 py-1 text-xs font-medium text-zinc-300">
                @{username}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Buscador Global RAWG */}
          <div className="flex-1 md:max-w-xl md:mx-6">
            <GlobalSearch
              inputRef={globalSearchInputRef}
              libraryByRawgId={libraryByRawgId}
              onSelectNewGame={(game) => setAddingGame(game)}
              onSelectExistingGame={(game) => setEditingGame(game)}
            />
          </div>

          {/* Perfil escritorio */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800/90 bg-[#111118] px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-zinc-200">
                @{username}
              </span>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-[#111118] hover:border-zinc-700 hover:bg-zinc-800/80 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Contadores rápidos */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="rounded-2xl border border-zinc-800/80 bg-[#111119] p-4 sm:p-5">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">
                Total en biblioteca
              </span>
              <Library className="h-4 w-4 text-violet-400" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-white font-mono">
              {stats.counts.all}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {stats.counts.pending} pendientes en backlog
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-[#111119] p-4 sm:p-5">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">
                Jugando ahora
              </span>
              <Play className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-white font-mono">
              {stats.counts.playing}
            </p>
            <p className="mt-1 text-xs text-zinc-500">En progreso activo</p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-[#111119] p-4 sm:p-5">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">
                Completados
              </span>
              <Trophy className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-white font-mono">
              {stats.counts.completed}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {stats.completionRate}% de tu biblioteca
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-[#111119] p-4 sm:p-5">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">
                Promedio personal
              </span>
              <Star className="h-4 w-4 text-amber-400" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-white font-mono">
              {stats.averageRating !== null
                ? stats.averageRating.toFixed(1)
                : "—"}
              {stats.averageRating !== null && (
                <span className="text-sm font-normal text-zinc-500"> / 10</span>
              )}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {stats.ratedCount > 0
                ? `Basado en ${stats.ratedCount} ${
                    stats.ratedCount === 1 ? "juego" : "juegos"
                  }`
                : "Aún sin calificaciones"}
            </p>
          </div>
        </section>

        {/* Controles: Tabs de estado + Buscador local + Orden */}
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {TABS.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`inline-flex items-center gap-2 shrink-0 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium transition cursor-pointer ${
                    active
                      ? "bg-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                      : "border border-zinc-800/80 bg-[#111119] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[11px] font-mono ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-zinc-900 text-zinc-500"
                    }`}
                  >
                    {stats.counts[tab.id]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Filtrar tus juegos..."
                className="w-full rounded-xl border border-zinc-800 bg-[#111119] pl-9 pr-8 py-2 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500/60 focus:outline-none transition"
              />
              {localQuery && (
                <button
                  type="button"
                  onClick={() => setLocalQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
                  aria-label="Limpiar filtro"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="relative flex items-center">
              <Filter className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-zinc-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Ordenar biblioteca"
                className="w-full sm:w-auto rounded-xl border border-zinc-800 bg-[#111119] pl-8 pr-4 py-2 text-xs sm:text-sm text-zinc-300 focus:border-violet-500/60 focus:outline-none cursor-pointer"
              >
                <option value="updated">Recientes</option>
                <option value="rating">Mejor puntuados</option>
                <option value="title">Título (A–Z)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Grid de juegos o Estado Vacío */}
        {filteredGames.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-zinc-800 bg-[#111119]/50 px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-4">
              <Gamepad2 className="h-7 w-7 text-violet-400" />
            </div>
            {games.length === 0 ? (
              <>
                <h2 className="text-lg font-semibold text-white">
                  Tu biblioteca está lista para empezar
                </h2>
                <p className="mt-1.5 mx-auto max-w-md text-sm text-zinc-400">
                  Usa el buscador superior conectado a RAWG para encontrar
                  cualquier videojuego y llevar el control de tu backlog,
                  progreso y notas.
                </p>
                <button
                  type="button"
                  onClick={() => globalSearchInputRef.current?.focus()}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.28)] transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Buscar mi primer juego
                </button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-white">
                  Sin resultados para este filtro
                </h2>
                <p className="mt-1.5 text-sm text-zinc-400">
                  Prueba cambiando la pestaña de estado o borrando el texto del
                  buscador interno.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setLocalQuery("");
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 transition cursor-pointer"
                >
                  Ver toda mi biblioteca
                </button>
              </>
            )}
          </section>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onEdit={(g) => setEditingGame(g)}
                onQuickStatusChange={handleQuickStatusChange}
              />
            ))}
          </section>
        )}
      </main>

      {/* Modal para Agregar desde RAWG */}
      {addingGame && (
        <GameFormModal
          mode="add"
          rawgGame={addingGame}
          onClose={() => setAddingGame(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Modal para Editar Juego existente */}
      {editingGame && (
        <GameFormModal
          mode="edit"
          existingGame={editingGame}
          onClose={() => setEditingGame(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}

      {/* Toast discreto */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-[#12161d]/95 backdrop-blur-md px-4 py-3 text-sm text-emerald-200 shadow-2xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
