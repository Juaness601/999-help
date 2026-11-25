-- ============================================================================
-- 999help - Esquema de Base de Datos y Seguridad (Supabase / PostgreSQL)
-- ============================================================================

CREATE TYPE public.game_status AS ENUM (
  'playing',    -- Jugando / Iniciado
  'completed',  -- Completado
  'pending',    -- Pendiente
  'dropped'     -- Abandonado (Lo dejé)
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Tabla de Perfiles (vinculada 1:1 con auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT username_format_check CHECK (
    char_length(username) BETWEEN 3 AND 24
    AND username ~ '^[a-z0-9_.]+$'
  )
);

CREATE UNIQUE INDEX profiles_username_lower_uidx
  ON public.profiles (lower(username));

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_username TEXT;
  clean_username TEXT;
BEGIN
  raw_username := COALESCE(
    NEW.raw_user_meta_data ->> 'username',
    split_part(NEW.email, '@', 1)
  );

  clean_username := lower(trim(raw_username));

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, clean_username, trim(raw_username));

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Tabla de Biblioteca Personal (user_games)
CREATE TABLE public.user_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Metadatos cacheados desde RAWG API
  rawg_id INTEGER NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  cover_url TEXT,
  released_date DATE,
  genres TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  available_platforms TEXT[] NOT NULL DEFAULT '{}'::TEXT[],

  -- Seguimiento personal del usuario
  status public.game_status NOT NULL DEFAULT 'pending',
  platform TEXT NOT NULL DEFAULT 'PC',
  progress TEXT,
  rating NUMERIC(3, 1) CHECK (
    rating IS NULL OR (rating >= 1.0 AND rating <= 10.0)
  ),
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT user_games_unique_per_user UNIQUE (user_id, rawg_id)
);

CREATE INDEX idx_user_games_user_id ON public.user_games (user_id);
CREATE INDEX idx_user_games_user_status ON public.user_games (user_id, status);
CREATE INDEX idx_user_games_user_updated ON public.user_games (user_id, updated_at DESC);

CREATE TRIGGER set_user_games_updated_at
  BEFORE UPDATE ON public.user_games
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "user_games_select_own"
  ON public.user_games FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "user_games_insert_own"
  ON public.user_games FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "user_games_update_own"
  ON public.user_games FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "user_games_delete_own"
  ON public.user_games FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
