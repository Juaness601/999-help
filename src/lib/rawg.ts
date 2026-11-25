import type { RawgApiSearchResponse, RawgSearchGame } from "@/types/rawg";

const RAWG_BASE_URL = "https://api.rawg.io/api";

export async function searchRawgGames(query: string): Promise<RawgSearchGame[]> {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    throw new Error("RAWG_API_KEY no está configurada en el servidor.");
  }

  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    key: apiKey,
    search: trimmed,
    page_size: "12",
    search_precise: "true",
  });

  const response = await fetch(`${RAWG_BASE_URL}/games?${params.toString()}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`RAWG API respondió con estado ${response.status}`);
  }

  const data = (await response.json()) as RawgApiSearchResponse;

  return (data.results || []).map((item) => {
    const platformsSource = item.platforms?.length
      ? item.platforms.map((p) => p.platform.name)
      : (item.parent_platforms || []).map((p) => p.platform.name);

    return {
      rawg_id: item.id,
      slug: item.slug,
      title: item.name,
      cover_url: item.background_image || null,
      released_date: item.released || null,
      release_year: item.released ? item.released.slice(0, 4) : null,
      genres: (item.genres || []).map((g) => g.name),
      available_platforms: Array.from(new Set(platformsSource)).slice(0, 6),
      metacritic: item.metacritic ?? null,
    };
  });
}
