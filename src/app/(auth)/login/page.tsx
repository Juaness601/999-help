import { AuthForm } from "@/components/auth/AuthForm";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function LoginPage() {
  return <AuthForm mode="login" supabaseConfigured={isSupabaseConfigured()} />;
}
