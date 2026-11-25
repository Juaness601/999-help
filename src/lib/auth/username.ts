const USERNAME_REGEX = /^[a-z0-9_.]{3,24}$/;

export function normalizeUsername(raw: string): string {
  return raw.toLowerCase().trim();
}

export function validateUsername(raw: string): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  const normalized = normalizeUsername(raw);

  if (!normalized) {
    return {
      valid: false,
      normalized,
      error: "Ingresa un nombre de usuario.",
    };
  }

  if (normalized.length < 3 || normalized.length > 24) {
    return {
      valid: false,
      normalized,
      error: "El usuario debe tener entre 3 y 24 caracteres.",
    };
  }

  if (!USERNAME_REGEX.test(normalized)) {
    return {
      valid: false,
      normalized,
      error: "Usa solo letras, números, punto (.) o guion bajo (_).",
    };
  }

  if (normalized.startsWith(".") || normalized.endsWith(".") || normalized.includes("..")) {
    return {
      valid: false,
      normalized,
      error: "El nombre de usuario no puede empezar, terminar ni repetir puntos.",
    };
  }

  return { valid: true, normalized };
}

/**
 * Wrapper interno invisible para Supabase Auth:
 * Convierte un nombre de usuario en un correo sintético válido (ej. jugador@999help.app).
 */
export function usernameToInternalEmail(rawUsername: string): string {
  const domain =
    (process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN || "999help.app")
      .toLowerCase()
      .trim() || "999help.app";
  const normalized = normalizeUsername(rawUsername);
  return `${normalized}@${domain}`;
}
