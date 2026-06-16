"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RESPONSE_OPTIONS } from "@/lib/ippr-content";
import {
  ResponseCategory,
  SerializedModule,
  SerializedSession
} from "@/lib/session-types";
import { getScreeningPlan } from "@/lib/screening";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const primaryActions = RESPONSE_OPTIONS.filter(
  (option) => option.category !== "UNKNOWN"
);
const unknownAction = RESPONSE_OPTIONS.find(
  (option) => option.category === "UNKNOWN"
);

const actionClassByCategory: Record<ResponseCategory, string> = {
  INTERESTED:
    "border-[var(--positive)] bg-[var(--positive)] text-white shadow-sm hover:brightness-95",
  UNSURE:
    "border-[var(--warning)] bg-[var(--warning)] text-white shadow-sm hover:brightness-95",
  NOT_INTERESTED:
    "border-[var(--negative)] bg-[var(--negative)] text-white shadow-sm hover:brightness-95",
  UNKNOWN:
    "border-border bg-card text-muted-foreground hover:border-primary hover:bg-secondary"
};

const reviewClassByCategory: Record<ResponseCategory, string> = {
  INTERESTED: "border-[var(--positive)] bg-[var(--positive-soft)] text-foreground",
  UNSURE: "border-[var(--warning)] bg-[var(--warning-soft)] text-foreground",
  NOT_INTERESTED: "border-[var(--negative)] bg-[var(--negative-soft)] text-foreground",
  UNKNOWN: "border-border bg-secondary text-secondary-foreground"
};

export function IpprRunner({
  initialSession
}: {
  initialSession: SerializedSession;
}) {
  const router = useRouter();
  const modules = initialSession.test.modules;
  const initialModule =
    modules[Math.min(initialSession.currentModuleOrder, modules.length - 1)];
  const [moduleIndex, setModuleIndex] = useState(
    Math.min(initialSession.currentModuleOrder, modules.length - 1)
  );
  const [cardIndex, setCardIndex] = useState(() =>
    firstUnansweredIndex(initialModule, initialSession.responses)
  );
  const [responses, setResponses] = useState(initialSession.responses);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [feedback, setFeedback] = useState("Elegí una opción para avanzar");
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  const activeModule = modules[moduleIndex];
  const activePlan = getScreeningPlan(activeModule, responses);
  const activeItem =
    activeModule.items[cardIndex] ??
    activePlan.nextItem ??
    activeModule.items[0];
  const activeRequiredPosition = Math.max(
    activePlan.requiredItems.findIndex((item) => item.id === activeItem.id) + 1,
    1
  );
  const answeredCount = activePlan.answeredRequiredCount;
  const activeComplete = activePlan.complete;
  const showCompleteCard = activeComplete && !isReviewing;
  const completedModules = modules.filter((module) =>
    isModuleComplete(module, responses)
  ).length;
  const allComplete = completedModules === modules.length;
  const totalItems = modules.reduce(
    (sum, module) => sum + getScreeningPlan(module, responses).requiredCount,
    0
  );
  const totalAnswered = modules.reduce(
    (sum, module) =>
      sum + getScreeningPlan(module, responses).answeredRequiredCount,
    0
  );
  const totalProgressPercent = Math.round((totalAnswered / totalItems) * 100);
  const fieldProgressPercent = Math.round(
    (answeredCount / activePlan.requiredCount) * 100
  );

  const groupedCounts = useMemo(
    () =>
      RESPONSE_OPTIONS.map((option) => ({
        ...option,
        count: activePlan.requiredItems.filter(
          (item) => responses[item.id]?.category === option.category
        ).length
      })),
    [activePlan.requiredItems, responses]
  );

  useEffect(() => {
    const nextIndex = firstUnansweredIndex(activeModule, responses);
    setCardIndex(nextIndex);
    setIsReviewing(false);
    setFeedback(
      isModuleComplete(activeModule, responses)
        ? "Campo completo"
        : "Elegí una opción para avanzar"
    );
  }, [activeModule, responses]);

  async function saveResponse(itemId: string, category: ResponseCategory) {
    const numericValue =
      RESPONSE_OPTIONS.find((option) => option.category === category)
        ?.numericValue ?? 0;
    const nextResponses = {
      ...responses,
      [itemId]: {
        category,
        numericValue,
        answeredAt: new Date().toISOString()
      }
    };
    const nextPlan = getScreeningPlan(activeModule, nextResponses);
    const nextAnsweredCount = nextPlan.answeredRequiredCount;
    const nextUnanswered = firstUnansweredIndex(activeModule, nextResponses);

    setResponses(nextResponses);
    setCardIndex(nextUnanswered);
    setIsReviewing(false);
    setSaveStatus("saving");
    setFeedback(feedbackForPlan(nextPlan));
    setError("");

    try {
      const response = await fetch("/api/responses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: initialSession.id,
          itemId,
          category
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo guardar la respuesta.");
      }

      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    }
  }

  async function goToModule(nextIndex: number) {
    const boundedIndex = Math.max(0, Math.min(modules.length - 1, nextIndex));
    const nextModule = modules[boundedIndex];
    setModuleIndex(boundedIndex);
    setCardIndex(firstUnansweredIndex(nextModule, responses));
    setIsReviewing(false);
    setFeedback(
      isModuleComplete(nextModule, responses)
        ? "Campo completo"
        : "Elegí una opción para avanzar"
    );
    setSaveStatus("saving");

    try {
      await fetch(`/api/sessions/${initialSession.id}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentModuleOrder: boundedIndex })
      });
      setSaveStatus("saved");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSaveStatus("error");
      setError("No se pudo actualizar el progreso.");
    }
  }

  async function completeSession() {
    if (!allComplete) {
      return;
    }

    setIsCompleting(true);
    setError("");

    try {
      const response = await fetch(`/api/sessions/${initialSession.id}/complete`, {
        method: "POST"
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo finalizar el recorrido.");
      }

      router.push(`/ippr/${initialSession.id}/complete`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo finalizar el recorrido."
      );
      setIsCompleting(false);
    }
  }

  return (
    <main className="min-h-screen px-3 py-3 sm:px-6 sm:py-6">
      <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-5">
        <section className="min-w-0 space-y-3 sm:space-y-5">
          <header className="rounded-lg border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  {initialSession.participant.name}
                </p>
                <h1 className="mt-1 text-xl font-bold leading-tight sm:text-3xl">
                  {initialSession.test.name}
                </h1>
                <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-muted-foreground sm:block">
                  Respondé una carta por vez. Cada elección se guarda sola y te
                  lleva a la siguiente actividad.
                </p>
              </div>
              <SaveBadge status={saveStatus} />
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">
                  {totalAnswered} de {totalItems} actividades
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {completedModules} de {modules.length} campos
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${totalProgressPercent}%` }}
                />
              </div>
            </div>
          </header>

          <section className="rounded-lg border bg-card p-3 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-secondary text-3xl" aria-hidden>
                  {activeModule.icon}
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">
                    Campo {moduleIndex + 1} de {modules.length}
                  </p>
                  <h2 className="text-lg font-bold leading-tight sm:text-xl">
                    {activeModule.title}
                  </h2>
                </div>
              </div>
              <span className="rounded-full border bg-background px-3 py-1 text-sm font-semibold text-primary">
                {answeredCount}/{activePlan.requiredCount}
              </span>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{feedback}</span>
                <span className="shrink-0 text-muted-foreground">
                  {fieldProgressPercent}% ·{" "}
                  {activePlan.phase === "VALIDATION" ? "validación" : "núcleo"}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${fieldProgressPercent}%` }}
                />
              </div>
            </div>

            <div className="hidden">
              {groupedCounts.map((option) => (
                <div
                  key={option.category}
                  className={`rounded-md border px-3 py-2 text-sm ${reviewClassByCategory[option.category]}`}
                >
                  <span className="block font-semibold">{option.shortLabel}</span>
                  <span>{option.count}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border bg-card p-3 shadow-sm sm:p-5">
            {showCompleteCard ? (
              <FieldComplete
                isLastModule={moduleIndex === modules.length - 1}
                allComplete={allComplete}
                isCompleting={isCompleting}
                onNext={() => goToModule(moduleIndex + 1)}
                onComplete={completeSession}
              />
            ) : (
              <article className="mx-auto max-w-3xl">
                <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>Actividad {activeItem.order + 1}</span>
                  <span>
                    {activeRequiredPosition} de {activePlan.requiredCount}
                  </span>
                </div>

                <div className="mt-4 flex min-h-[9rem] items-center rounded-lg border bg-background p-4 sm:min-h-[10rem] sm:p-6">
                  <p className="text-[clamp(1.35rem,5.8vw,2rem)] font-bold leading-snug text-foreground sm:text-3xl">
                    {activeItem.prompt}
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {primaryActions.map((option) => (
                    <button
                      key={option.category}
                      type="button"
                      data-testid={`response-${activeItem.id}-${option.category}`}
                      onClick={() => saveResponse(activeItem.id, option.category)}
                      className={`focus-ring min-h-14 rounded-md border-2 px-4 py-3 text-base font-bold transition active:translate-y-px ${actionClassByCategory[option.category]}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {unknownAction ? (
                  <button
                    type="button"
                    data-testid={`response-${activeItem.id}-${unknownAction.category}`}
                    onClick={() =>
                      saveResponse(activeItem.id, unknownAction.category)
                    }
                    className={`focus-ring mt-3 min-h-12 w-full rounded-md border px-4 py-3 text-sm font-semibold transition active:translate-y-px ${actionClassByCategory[unknownAction.category]}`}
                  >
                    {unknownAction.label}
                  </button>
                ) : null}
              </article>
            )}
          </section>

          <section className="rounded-lg border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">Revisión del campo</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tocá una actividad para cambiar la respuesta.
                </p>
              </div>
            </div>

            <div className="mt-4 grid max-h-[26rem] gap-2 overflow-auto pr-1">
              {activePlan.requiredItems.map((item) => {
                const response = responses[item.id];
                const option = RESPONSE_OPTIONS.find(
                  (entry) => entry.category === response?.category
                );
                const active = item.id === activeItem.id && !activeComplete;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCardIndex(item.order);
                      setIsReviewing(true);
                      setFeedback("Podés cambiar esta respuesta");
                    }}
                    className={`focus-ring flex min-h-11 items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition ${
                      response
                        ? reviewClassByCategory[response.category]
                        : "border-border bg-card text-muted-foreground"
                    } ${active ? "ring-2 ring-primary" : ""}`}
                  >
                    <span className="line-clamp-2 font-medium">
                      {item.order + 1}. {item.prompt}
                    </span>
                    <span className="shrink-0 text-xs font-bold">
                      {option?.shortLabel ?? "Pendiente"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {error ? (
            <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <nav className="sticky bottom-0 z-10 -mx-3 border-t bg-background/95 px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 lg:mx-0">
              <button
                type="button"
                data-testid="previous-module"
                disabled={moduleIndex === 0}
                onClick={() => goToModule(moduleIndex - 1)}
                className="focus-ring min-h-11 rounded-md border bg-card px-4 py-3 text-sm font-semibold transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-45"
              >
                Anterior
              </button>

              {moduleIndex === modules.length - 1 ? (
                <button
                  type="button"
                  data-testid="complete-session"
                  disabled={!allComplete || isCompleting}
                  onClick={completeSession}
                  className="focus-ring min-h-11 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isCompleting ? "Finalizando..." : "Finalizar"}
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="next-module"
                  disabled={!activeComplete}
                  onClick={() => goToModule(moduleIndex + 1)}
                  className="focus-ring min-h-11 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Siguiente campo
                </button>
              )}
            </div>
          </nav>
        </section>

        <aside className="order-last rounded-lg border bg-card p-4 shadow-sm lg:order-none lg:sticky lg:top-6 lg:h-fit">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Avance
            </h2>
            <span className="text-sm font-semibold text-primary">
              {totalAnswered}/{totalItems}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {modules.map((module, index) => {
              const complete = isModuleComplete(module, responses);
              const active = index === moduleIndex;
              const plan = getScreeningPlan(module, responses);

              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => goToModule(index)}
                  className={`focus-ring rounded-md border px-3 py-2 text-left text-sm transition ${
                    active
                      ? "border-primary bg-secondary text-primary"
                      : "border-transparent hover:border-border hover:bg-secondary"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">
                      {module.icon} {module.title}
                    </span>
                    <span className="shrink-0 text-xs font-bold">
                      {complete ? "OK" : `${plan.answeredRequiredCount}/${plan.requiredCount}`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </main>
  );
}

function FieldComplete({
  isLastModule,
  allComplete,
  isCompleting,
  onNext,
  onComplete
}: {
  isLastModule: boolean;
  allComplete: boolean;
  isCompleting: boolean;
  onNext: () => void;
  onComplete: () => void;
}) {
  return (
    <div className="mx-auto grid max-w-2xl place-items-center py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
        OK
      </div>
      <h3 className="mt-5 text-2xl font-bold">Campo completo</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Las respuestas de este campo quedaron guardadas. Podés revisar abajo o
        seguir con el recorrido.
      </p>
      {isLastModule ? (
        <button
          type="button"
          data-testid="complete-session-card"
          disabled={!allComplete || isCompleting}
          onClick={onComplete}
          className="focus-ring mt-5 min-h-11 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isCompleting ? "Finalizando..." : "Finalizar IPPR"}
        </button>
      ) : (
        <button
          type="button"
          data-testid="next-module-card"
          onClick={onNext}
          className="focus-ring mt-5 min-h-11 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-[var(--primary-strong)]"
        >
          Ir al siguiente campo
        </button>
      )}
    </div>
  );
}

function SaveBadge({ status }: { status: SaveStatus }) {
  const label =
    status === "saving"
      ? "Guardando..."
      : status === "saved"
        ? "Guardado"
        : status === "error"
          ? "Error al guardar"
          : "Listo";

  return (
    <span className="shrink-0 rounded-full border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground sm:text-sm">
      {label}
    </span>
  );
}

function countAnswered(
  module: SerializedModule,
  responses: SerializedSession["responses"]
) {
  return getScreeningPlan(module, responses).answeredRequiredCount;
}

function firstUnansweredIndex(
  module: SerializedModule,
  responses: SerializedSession["responses"]
) {
  const plan = getScreeningPlan(module, responses);
  return plan.nextItem?.order ?? 0;
}

function isModuleComplete(
  module: SerializedModule,
  responses: SerializedSession["responses"]
) {
  return getScreeningPlan(module, responses).complete;
}

function feedbackForPlan(plan: ReturnType<typeof getScreeningPlan>) {
  if (plan.complete) {
    return "Campo completo";
  }

  if (
    plan.phase === "VALIDATION" &&
    plan.answeredRequiredCount === plan.coreCount
  ) {
    return "Abrimos cartas de validación";
  }

  if (plan.answeredRequiredCount === Math.ceil(plan.requiredCount / 2)) {
    return "Mitad del campo";
  }

  if (plan.answeredRequiredCount > 0 && plan.answeredRequiredCount % 4 === 0) {
    return "Buen ritmo";
  }

  return "Guardado";
}
