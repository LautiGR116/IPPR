import Link from "next/link";
import { notFound } from "next/navigation";
import { serializeSession } from "@/lib/session-service";
import { getScreeningSummary } from "@/lib/screening";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function CompletePage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await serializeSession(sessionId);

  if (!session) {
    notFound();
  }

  const completedAt = session.completedAt
    ? new Intl.DateTimeFormat("es-AR", {
        dateStyle: "long",
        timeStyle: "short"
      }).format(new Date(session.completedAt))
    : "pendiente de registrar";
  const summaries = session.test.modules.map((module) =>
    getScreeningSummary(module, session.responses)
  );
  const validationCount = summaries.filter(
    (summary) => summary.phase === "VALIDATION"
  ).length;

  return (
    <main className="min-h-screen px-3 py-5 sm:px-6 sm:py-8">
      <section className="mx-auto w-full max-w-5xl rounded-lg border bg-card p-4 shadow-sm sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
          OK
        </div>
        <div className="text-center">
          <h1 className="mt-5 text-2xl font-bold sm:text-3xl">
            Screening IPPR completado
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Las respuestas de {session.participant.name} quedaron registradas.
            Este mapa es preliminar: muestra señales dentro de las áreas
            exploradas, no una interpretación vocacional definitiva.
          </p>
        </div>
        <dl className="mt-6 grid gap-3 rounded-lg border bg-background p-4 text-left text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-4 rounded-md bg-card px-3 py-2">
            <dt className="font-semibold">Código</dt>
            <dd>{session.participant.code}</dd>
          </div>
          <div className="flex justify-between gap-4 rounded-md bg-card px-3 py-2">
            <dt className="font-semibold">Finalización</dt>
            <dd>{completedAt}</dd>
          </div>
          <div className="flex justify-between gap-4 rounded-md bg-card px-3 py-2">
            <dt className="font-semibold">Estado</dt>
            <dd>{session.status}</dd>
          </div>
          <div className="flex justify-between gap-4 rounded-md bg-card px-3 py-2">
            <dt className="font-semibold">Alcance</dt>
            <dd>{validationCount} áreas validadas de {summaries.length}</dd>
          </div>
        </dl>

        <section className="mt-6">
          <div>
            <h2 className="text-xl font-bold">Mapa preliminar de intereses</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Las áreas con confianza alta se cerraron con preguntas núcleo; las
              áreas medias, bajas o ambiguas recibieron cartas de validación.
            </p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {summaries.map((summary) => (
              <article
                key={summary.module.id}
                className="rounded-lg border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">
                      {summary.module.icon} {summary.module.title}
                    </h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {summary.phase === "VALIDATION"
                        ? "Validación adaptativa"
                        : "Núcleo suficiente"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border bg-background px-3 py-1 text-xs font-bold text-primary">
                    {labelSignal(summary.signal)}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
                  <Metric label="Interés" value={summary.counts.interested} />
                  <Metric label="Dudas" value={summary.counts.unsure} />
                  <Metric label="No" value={summary.counts.notInterested} />
                  <Metric label="No conozco" value={summary.counts.unknown} />
                </dl>

                <p className="mt-3 text-sm text-muted-foreground">
                  Confianza:{" "}
                  <span className="font-semibold text-foreground">
                    {labelConfidence(summary.confidence)}
                  </span>{" "}
                  · {summary.answeredRequiredCount}/{summary.requiredCount} cartas
                </p>

                <div className="mt-3 rounded-md border bg-background p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Notas para orientador
                  </p>
                  <ul className="mt-2 grid gap-1 text-sm text-foreground">
                    {summary.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>

                {summary.flags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {summary.flags.map((flag) => (
                      <span
                        key={flag}
                        className="rounded-full border border-[var(--warning)] bg-[var(--warning-soft)] px-2 py-1 text-xs font-semibold text-foreground"
                      >
                        {labelFlag(flag)}
                      </span>
                    ))}
                  </div>
                ) : null}

                {summary.interestedItems.length > 0 ? (
                  <ul className="mt-3 grid gap-1 text-sm">
                    {summary.interestedItems.slice(0, 3).map((item) => (
                      <li key={item.id} className="text-foreground">
                        {item.prompt}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No aparecieron actividades marcadas como interés en esta
                    exploración.
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>

        <Link
          href="/"
          className="focus-ring mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-[var(--primary-strong)]"
        >
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background px-2 py-2">
      <dt className="font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-bold">{value}</dd>
    </div>
  );
}

function labelSignal(signal: string) {
  if (signal === "HIGH") {
    return "Señal alta";
  }

  if (signal === "LOW") {
    return "Señal baja";
  }

  if (signal === "AMBIGUOUS") {
    return "Ambigua";
  }

  return "Sin definir";
}

function labelConfidence(confidence: string) {
  if (confidence === "HIGH") {
    return "alta";
  }

  if (confidence === "MEDIUM") {
    return "media";
  }

  return "baja";
}

function labelFlag(flag: string) {
  if (flag === "REPETITIVE_INTERESTED") {
    return "interés repetitivo";
  }

  if (flag === "REPETITIVE_NOT_INTERESTED") {
    return "rechazo repetitivo";
  }

  if (flag === "HIGH_UNKNOWN") {
    return "mucho desconocimiento";
  }

  if (flag === "MIXED_PATTERN") {
    return "patrón mixto";
  }

  if (flag === "VALIDATION_NEEDED") {
    return "validación pendiente";
  }

  if (flag === "LOW_CONFIDENCE_AFTER_VALIDATION") {
    return "confianza baja";
  }

  return flag;
}
