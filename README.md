# 999help

Biblioteca y rastreador personal de videojuegos (backlog) construido con **Next.js (App Router)**, **Tailwind CSS**, **Supabase (PostgreSQL + Auth)** y la **API de RAWG**.

## Características principales

- **Login sin correo electrónico:** Registro e inicio de sesión únicamente con nombre de usuario y contraseña (wrapper interno automático `@999help.app`).
- **Buscador global en tiempo real (RAWG API):** Proxy seguro en servidor (`/api/rawg/search`) con caché para buscar cualquier videojuego con portada, año, géneros y plataformas.
- **Gestión personal completa:** Estado (`Jugando`, `Completado`, `Pendiente`, `Abandonado`), plataforma, progreso libre, puntuación decimal (`1.0–10.0`) y bitácora personal.
- **Dashboard privado:** Pestañas por estado, filtro local de biblioteca, ordenamiento y métricas rápidas (total, jugando, completados y promedio de puntuación).

## Puesta en marcha

1. **Base de datos en Supabase:**
   - Ejecuta `supabase/schema.sql` en **Supabase → SQL Editor**.
   - Desactiva **Confirm email** en **Authentication → Providers → Email**.
2. **Variables de entorno:**
   - Copia `.env.example` a `.env.local` y completa `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `RAWG_API_KEY`.
3. **Ejecutar en local:**
   ```bash
   npm install
   npm run dev
   ```
4. **Despliegue en Vercel:**
   - Importa el repositorio o ejecuta `vercel --prod`.
   - Configura las mismas variables de entorno en **Vercel → Project Settings → Environment Variables**.
