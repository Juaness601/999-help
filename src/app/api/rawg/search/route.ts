import { NextRequest, NextResponse } from "next/server";
import { searchRawgGames } from "@/lib/rawg";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { error: "Debes iniciar sesión para buscar juegos." },
          { status: 401 }
        );
      }
    }

    const query = request.nextUrl.searchParams.get("q") || "";
    if (query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchRawgGames(query);
    return NextResponse.json({ results });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Error consultando la base de datos de RAWG.";
    const isMissingKey = message.includes("RAWG_API_KEY");
    return NextResponse.json(
      { error: message },
      { status: isMissingKey ? 503 : 500 }
    );
  }
}
