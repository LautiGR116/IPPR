import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DebugPage() {
  const sessions = await prisma.testSession.findMany({
    orderBy: { startedAt: "desc" },
    include: {
      participant: true,
      test: true,
      progress: {
        include: { module: true },
        orderBy: { module: { order: "asc" } }
      },
      responses: {
        include: {
          item: {
            include: { module: true }
          }
        },
        orderBy: { updatedAt: "desc" }
      },
      topPicks: {
        include: {
          item: true,
          module: true
        },
        orderBy: [{ module: { order: "asc" } }, { rank: "asc" }]
      }
    }
  });

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Debug IPPR</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Validación interna de sesiones, progreso y respuestas persistidas.
            </p>
          </div>
          <Link
            href="/"
            className="focus-ring rounded-md border bg-card px-4 py-2 text-sm font-semibold"
          >
            Inicio
          </Link>
        </div>

        <div className="mt-6 grid gap-4">
          {sessions.length === 0 ? (
            <p className="rounded-lg border bg-card p-4 text-sm">
              Todavía no hay sesiones guardadas.
            </p>
          ) : null}

          {sessions.map((session) => {
            const debugPayload = {
              session: {
                id: session.id,
                status: session.status,
                currentModuleOrder: session.currentModuleOrder,
                startedAt: session.startedAt,
                completedAt: session.completedAt
              },
              participant: {
                id: session.participant.id,
                code: session.participant.code,
                name: session.participant.name
              },
              test: {
                slug: session.test.slug,
                version: session.test.version
              },
              progress: session.progress.map((progress) => ({
                module: progress.module.title,
                status: progress.status,
                answeredCount: progress.answeredCount,
                topCount: progress.topCount,
                completedAt: progress.completedAt
              })),
              responses: session.responses.map((response) => ({
                module: response.item.module.title,
                item: response.item.prompt,
                category: response.category,
                numericValue: response.numericValue,
                answeredAt: response.answeredAt
              })),
              topPicks: session.topPicks.map((pick) => ({
                module: pick.module.title,
                rank: pick.rank,
                item: pick.item.prompt
              }))
            };

            return (
              <article
                key={session.id}
                className="rounded-lg border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">
                      {session.participant.name} · {session.participant.code}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {session.status} · {session.responses.length} respuestas ·{" "}
                      {session.topPicks.length} preferencias top
                    </p>
                  </div>
                  <Link
                    href={`/ippr/${session.id}`}
                    className="focus-ring rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  >
                    Abrir sesión
                  </Link>
                </div>
                <pre className="mt-4 max-h-[32rem] overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                  {JSON.stringify(debugPayload, null, 2)}
                </pre>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
