"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function startSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo iniciar IPPR.");
      }

      router.push(`/ippr/${payload.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar IPPR.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-5xl flex-col justify-center gap-6 lg:items-center lg:text-center">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            IPPR
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-foreground sm:text-5xl">
            Intereses y Preferencias Profesionales
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Una exploración breve por cartas para registrar intereses, dudas y
            actividades que conviene seguir mirando con el orientador.
          </p>
        </div>

        <form
          onSubmit={startSession}
          className="w-full max-w-xl rounded-lg border bg-card p-4 text-left shadow-sm sm:p-6"
        >
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Código</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="focus-ring min-h-12 rounded-md border bg-card px-4 py-3 text-base"
                placeholder="Ej: ORIENTADO-001"
                autoComplete="off"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Nombre</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="focus-ring min-h-12 rounded-md border bg-card px-4 py-3 text-base"
                placeholder="Nombre del orientado"
                autoComplete="name"
                required
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="focus-ring mt-5 min-h-12 w-full rounded-md bg-primary px-5 py-3 text-base font-semibold text-primary-foreground transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Iniciando..." : "Empezar IPPR"}
          </button>
        </form>
      </section>
    </main>
  );
}
