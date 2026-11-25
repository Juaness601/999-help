"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import {
  Check,
  Gamepad2,
  Loader2,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type { UserGame } from "@/types/database";
import type { RawgSearchGame } from "@/types/rawg";

interface GlobalSearchProps {
  libraryByRawgId: Map<number, UserGame>;
  onSelectNewGame: (game: RawgSearchGame) => void;
  onSelectExistingGame: (game: UserGame) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export function GlobalSearch({
  libraryByRawgId,
  onSelectNewGame,
  onSelectExistingGame,
  inputRef: externalRef,
}: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RawgSearchGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const resolvedInputRef = externalRef ?? internalInputRef;

  // Atajo Ctrl+K / Cmd+K para enfocar el buscador global
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        resolvedInputRef.current?.focus();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resolvedInputRef]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce hacia /api/rawg/search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/rawg/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "No se pudo consultar RAWG.");
          setResults([]);
        } else {
          setResults(data.results || []);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Error de conexión al buscar videojuegos.");
        }
      } finally {
        setLoading(false);
      }
    }, 320);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handlePick = (item: RawgSearchGame) => {
    const existing = libraryByRawgId.get(item.rawg_id);
    setOpen(false);
    if (existing) {
      onSelectExistingGame(existing);
    } else {
      onSelectNewGame(item);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-zinc-500" />
        <input
          ref={resolvedInputRef}
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder="Buscar cualquier videojuego en RAWG para agregar..."
          className="w-full rounded-xl border border-zinc-800 bg-[#12121a] pl-10 pr-20 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500/70 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition"
        />
        <div className="absolute right-2.5 flex items-center gap-1.5">
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
          )}
          {query && !loading && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setError(null);
              }}
              className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center rounded-md border border-zinc-700/80 bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Dropdown de resultados en tiempo real */}
      {open && (query.trim().length >= 2 || error) && (
        <div className="absolute left-0 right-0 mt-2 z-50 overflow-hidden rounded-2xl border border-zinc-800 bg-[#111119]/98 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2 text-[11px] uppercase tracking-wider text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-violet-400" />
              Catálogo Global RAWG
            </span>
            {results.length > 0 && <span>{results.length} resultados</span>}
          </div>

          {error ? (
            <div className="px-4 py-6 text-center text-sm text-rose-300">
              {error}
            </div>
          ) : loading && results.length === 0 ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl p-2 animate-pulse"
                >
                  <div className="h-12 w-20 rounded-lg bg-zinc-800/80" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-2/3 rounded bg-zinc-800/80" />
                    <div className="h-2.5 w-1/2 rounded bg-zinc-800/60" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              No se encontraron videojuegos para &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <ul className="max-h-[420px] overflow-y-auto divide-y divide-zinc-800/50 p-1.5">
              {results.map((game) => {
                const inLibrary = libraryByRawgId.has(game.rawg_id);
                return (
                  <li key={game.rawg_id}>
                    <button
                      type="button"
                      onClick={() => handlePick(game)}
                      className="w-full flex items-center gap-3.5 rounded-xl p-2 text-left hover:bg-zinc-800/60 transition group cursor-pointer"
                    >
                      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800">
                        {game.cover_url ? (
                          <Image
                            src={game.cover_url}
                            alt={game.title}
                            fill
                            sizes="96px"
                            className="object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-zinc-600">
                            <Gamepad2 className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-zinc-100 group-hover:text-white">
                            {game.title}
                          </p>
                          {game.release_year && (
                            <span className="shrink-0 text-xs font-mono text-zinc-500">
                              {game.release_year}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {game.available_platforms.slice(0, 3).map((plat) => (
                            <span
                              key={plat}
                              className="rounded-md bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400"
                            >
                              {plat}
                            </span>
                          ))}
                          {game.available_platforms.length > 3 && (
                            <span className="text-[10px] text-zinc-500">
                              +{game.available_platforms.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {inLibrary ? (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                            <Check className="h-3.5 w-3.5" />
                            Guardado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-300 group-hover:bg-violet-600 group-hover:text-white transition">
                            <Plus className="h-3.5 w-3.5" />
                            Agregar
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
