"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  usernameToInternalEmail,
  validateUsername,
} from "@/lib/auth/username";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export interface AuthActionState {
  error?: string;
}

function mapSupabaseAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Usuario o contraseña incorrectos.";
  }
  if (lower.includes("user already registered")) {
    return "Ese nombre de usuario ya está en uso. Prueba con otro.";
  }
  if (lower.includes("email not confirmed")) {
    return "Falta desactivar 'Confirm email' en Supabase Authentication → Providers → Email.";
  }
  if (lower.includes("password should be at least")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (lower.includes("rate limit")) {
    return "Demasiados intentos en poco tiempo. Espera un momento e inténtalo de nuevo.";
  }

  return "No se pudo completar la autenticación. Inténtalo nuevamente.";
}

export async function signInWithUsername(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase aún no está configurado. Agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const rawUsername = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");

  const validation = validateUsername(rawUsername);
  if (!validation.valid) {
    return { error: validation.error };
  }

  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const supabase = await createClient();
  const internalEmail = usernameToInternalEmail(validation.normalized);

  const { error } = await supabase.auth.signInWithPassword({
    email: internalEmail,
    password,
  });

  if (error) {
    return { error: mapSupabaseAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUpWithUsername(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase aún no está configurado. Agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const rawUsername = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  const validation = validateUsername(rawUsername);
  if (!validation.valid) {
    return { error: validation.error };
  }

  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const internalEmail = usernameToInternalEmail(validation.normalized);

  const { data, error } = await supabase.auth.signUp({
    email: internalEmail,
    password,
    options: {
      data: {
        username: rawUsername.trim(),
      },
    },
  });

  if (error) {
    return { error: mapSupabaseAuthError(error.message) };
  }

  // Si Supabase devolvió sesión inmediata (Confirm email desactivado), entramos al dashboard
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  // Fallback si la confirmación por email siguiera activada en el proyecto Supabase
  return {
    error:
      "Cuenta creada, pero Supabase exige confirmación de correo. Desactiva 'Confirm email' en Supabase → Authentication → Providers → Email.",
  };
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
