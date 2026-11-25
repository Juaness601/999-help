export interface RawgSearchGame {
  rawg_id: number;
  slug: string;
  title: string;
  cover_url: string | null;
  released_date: string | null;
  release_year: string | null;
  genres: string[];
  available_platforms: string[];
  metacritic: number | null;
}

export interface RawgApiGameItem {
  id: number;
  slug: string;
  name: string;
  background_image: string | null;
  released: string | null;
  metacritic: number | null;
  genres?: Array<{ id: number; name: string }>;
  platforms?: Array<{ platform: { id: number; name: string } }>;
  parent_platforms?: Array<{ platform: { id: number; name: string } }>;
}

export interface RawgApiSearchResponse {
  count: number;
  results: RawgApiGameItem[];
}
