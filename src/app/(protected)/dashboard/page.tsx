import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { UserGame } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: games }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_games")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
  ]);

  const username =
    profile?.display_name ||
    profile?.username ||
    (user.user_metadata?.username as string | undefined) ||
    user.email?.split("@")[0] ||
    "player";

  return (
    <DashboardClient
      username={username}
      initialGames={(games as UserGame[] | null) ?? []}
    />
  );
}
