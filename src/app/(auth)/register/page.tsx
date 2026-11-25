import { AuthForm } from "@/components/auth/AuthForm";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function RegisterPage() {
  return <AuthForm mode="register" supabaseConfigured={isSupabaseConfigured()} />;
}
