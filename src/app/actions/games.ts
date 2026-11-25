"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { GameStatus, UserGame } from "@/types/database";

export interface SaveGamePayload {
  id?: string;
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
}

export interface ActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

const VALID_STATUSES: GameStatus[] = [
  "playing",
  "completed",
  "pending",
  "dropped",
];

function sanitizeRating(rating: number | null): {
  value: number | null;
  error?: string;
} {
  if (rating === null || Number.isNaN(rating)) {
    return { value: null };
  }
  if (rating < 1 || rating > 10) {
    return {
      value: null,
      error: "La puntuación debe estar entre 1.0 y 10.0.",
    };
  }
  return { value: Math.round(rating * 10) / 10 };
}

export async function addGameToLibrary(
  payload: SaveGamePayload
): Promise<ActionResult<UserGame>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Sesión expirada. Vuelve a iniciar sesión." };
    }

    if (!VALID_STATUSES.includes(payload.status)) {
      return { success: false, error: "Estado de juego no válido." };
    }

    const platform = payload.platform.trim() || "PC";
    const parsedRating = sanitizeRating(payload.rating);
    if (parsedRating.error) {
      return { success: false, error: parsedRating.error };
    }

    const { data, error } = await supabase
      .from("user_games")
      .insert({
        user_id: user.id,
        rawg_id: payload.rawg_id,
        slug: payload.slug,
        title: payload.title,
        cover_url: payload.cover_url,
        released_date: payload.released_date || null,
        genres: payload.genres || [],
        available_platforms: payload.available_platforms || [],
        status: payload.status,
        platform,
        progress: payload.progress?.trim() || null,
        rating: parsedRating.value,
        notes: payload.notes?.trim() || null,
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: "Este juego ya está guardado en tu biblioteca.",
        };
      }
      return { success: false, error: "No se pudo guardar el juego." };
    }

    revalidatePath("/dashboard");
    return { success: true, data: data as UserGame };
  } catch {
    return { success: false, error: "Error inesperado al guardar el juego." };
  }
}

export async function updateLibraryGame(
  id: string,
  updates: {
    status: GameStatus;
    platform: string;
    progress: string | null;
    rating: number | null;
    notes: string | null;
  }
): Promise<ActionResult<UserGame>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Sesión expirada. Vuelve a iniciar sesión." };
    }

    if (!VALID_STATUSES.includes(updates.status)) {
      return { success: false, error: "Estado de juego no válido." };
    }

    const parsedRating = sanitizeRating(updates.rating);
    if (parsedRating.error) {
      return { success: false, error: parsedRating.error };
    }

    const { data, error } = await supabase
      .from("user_games")
      .update({
        status: updates.status,
        platform: updates.platform.trim() || "PC",
        progress: updates.progress?.trim() || null,
        rating: parsedRating.value,
        notes: updates.notes?.trim() || null,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return { success: false, error: "No se pudieron guardar los cambios." };
    }

    revalidatePath("/dashboard");
    return { success: true, data: data as UserGame };
  } catch {
    return { success: false, error: "Error inesperado al actualizar el juego." };
  }
}

export async function quickUpdateGameStatus(
  id: string,
  status: GameStatus
): Promise<ActionResult<UserGame>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Sesión expirada." };
    }

    if (!VALID_STATUSES.includes(status)) {
      return { success: false, error: "Estado no válido." };
    }

    const { data, error } = await supabase
      .from("user_games")
      .update({ status })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return { success: false, error: "No se pudo cambiar el estado." };
    }

    revalidatePath("/dashboard");
    return { success: true, data: data as UserGame };
  } catch {
    return { success: false, error: "Error inesperado al actualizar estado." };
  }
}

export async function deleteLibraryGame(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Sesión expirada." };
    }

    const { error } = await supabase
      .from("user_games")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: "No se pudo eliminar el juego." };
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Error inesperado al eliminar el juego." };
  }
}
