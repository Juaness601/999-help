"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Gamepad2,
  Loader2,
  Lock,
  User,
} from "lucide-react";
import {
  signInWithUsername,
  signUpWithUsername,
  type AuthActionState,
} from "@/app/actions/auth";

interface AuthFormProps {
  mode: "login" | "register";
  supabaseConfigured: boolean;
}

const initialState: AuthActionState = {};

export function AuthForm({ mode, supabaseConfigured }: AuthFormProps) {
  const isRegister = mode === "register";
  const action = isRegister ? signUpWithUsername : signInWithUsername;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-[#09090d] bg-grid-pattern overflow-hidden">
      {/* Glow ambiental */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[38rem] rounded-full bg-violet-600/15 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]"
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30 shadow-[0_0_30px_rgba(139,92,246,0.2)] mb-4">
            <Gamepad2 className="h-7 w-7 text-violet-300" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            999<span className="text-violet-400">help</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {isRegister
              ? "Crea tu cuenta solo con usuario y contraseña."
              : "Tu biblioteca y backlog personal de videojuegos."}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800/90 bg-[#111118]/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          {!supabaseConfigured && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-xs text-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <p className="font-medium">Faltan variables de entorno</p>
                <p className="mt-0.5 text-amber-200/80">
                  Configura <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
                  <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> para habilitar el
                  acceso.
                </p>
              </div>
            </div>
          )}

          {state?.error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1.5"
              >
                Nombre de usuario
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  minLength={3}
                  maxLength={24}
                  placeholder="ej. juane_999"
                  className="w-full rounded-xl border border-zinc-800 bg-[#0b0b10] pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/70 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition"
                />
              </div>
              {isRegister && (
                <p className="mt-1.5 text-[11px] text-zinc-500">
                  Sin correos ni verificaciones. Solo letras, números,{" "}
                  <code>_</code> o <code>.</code> (3–24 caracteres).
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-800 bg-[#0b0b10] pl-10 pr-11 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/70 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1.5"
                >
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-zinc-800 bg-[#0b0b10] pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/70 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_25px_rgba(139,92,246,0.28)] transition cursor-pointer"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isRegister ? "Crear mi biblioteca" : "Entrar a 999help"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center text-sm text-zinc-400">
            {isRegister ? (
              <>
                ¿Ya tienes cuenta?{" "}
                <Link
                  href="/login"
                  className="font-medium text-violet-400 hover:text-violet-300 transition"
                >
                  Iniciar sesión
                </Link>
              </>
            ) : (
              <>
                ¿Nuevo por aquí?{" "}
                <Link
                  href="/register"
                  className="font-medium text-violet-400 hover:text-violet-300 transition"
                >
                  Crear usuario
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
