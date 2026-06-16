import { ResponseCategory, SerializedModule } from "@/lib/session-types";

export const SCREENING_CORE_INDICES = [0, 2, 5, 8, 11];
export const SCREENING_VALIDATION_INDICES = [1, 4, 9];

type ScreeningResponse = {
  category: ResponseCategory | string;
};

type ScreeningResponses = Record<string, ScreeningResponse | undefined>;

type ScreeningItem = {
  id: string;
  order: number;
};

export type ScreeningSignal = "HIGH" | "LOW" | "AMBIGUOUS" | "UNKNOWN";
export type ScreeningConfidence = "LOW" | "MEDIUM" | "HIGH";
export type ScreeningFlag =
  | "REPETITIVE_INTERESTED"
  | "REPETITIVE_NOT_INTERESTED"
  | "HIGH_UNKNOWN"
  | "MIXED_PATTERN"
  | "VALIDATION_NEEDED"
  | "LOW_CONFIDENCE_AFTER_VALIDATION";

export function getScreeningPlan<TItem extends ScreeningItem>(
  module: { items: TItem[] },
  responses: ScreeningResponses
) {
  const orderedItems = [...module.items].sort((a, b) => a.order - b.order);
  const coreItems = pickByIndices(orderedItems, SCREENING_CORE_INDICES);
  const coreAnswered = coreItems.every((item) => responses[item.id]);
  const coreCounts = countCategories(coreItems, responses);
  const coreSignal = getSignal(coreCounts, coreItems.length, coreAnswered);
  const coreConfidence = getConfidenceFromCounts(
    coreCounts,
    coreItems.length,
    coreAnswered,
    false
  );
  const shouldValidate =
    coreAnswered &&
    (coreConfidence !== "HIGH" || coreSignal === "AMBIGUOUS");
  const validationItems = shouldValidate
    ? pickByIndices(orderedItems, SCREENING_VALIDATION_INDICES)
    : [];
  const requiredItems = [...coreItems, ...validationItems];
  const answeredRequiredCount = requiredItems.filter(
    (item) => responses[item.id]
  ).length;
  const counts = countCategories(requiredItems, responses);
  const complete =
    requiredItems.length > 0 && answeredRequiredCount === requiredItems.length;
  const signal = getSignal(counts, requiredItems.length, complete);
  const confidence = getConfidenceFromCounts(
    counts,
    requiredItems.length,
    complete,
    shouldValidate
  );
  const flags = getFlags(counts, requiredItems.length, {
    complete,
    confidence,
    shouldValidate
  });
  const nextItem =
    requiredItems.find((item) => !responses[item.id]) ??
    requiredItems[requiredItems.length - 1] ??
    orderedItems[0];

  return {
    requiredItems,
    nextItem,
    coreCount: coreItems.length,
    baseCount: coreItems.length,
    requiredCount: requiredItems.length,
    answeredRequiredCount,
    complete,
    phase: shouldValidate ? "VALIDATION" : "CORE",
    signal,
    confidence,
    flags,
    notes: getNotes({ signal, confidence, flags, shouldValidate, complete }),
    counts
  };
}

export function getScreeningSummary(
  module: SerializedModule,
  responses: ScreeningResponses
) {
  const plan = getScreeningPlan(module, responses);
  const interestedItems = plan.requiredItems.filter(
    (item) => responses[item.id]?.category === "INTERESTED"
  );

  return {
    module,
    ...plan,
    interestedItems
  };
}

function pickByIndices<TItem>(items: TItem[], indices: number[]) {
  return indices
    .map((index) => items[index])
    .filter((item): item is TItem => Boolean(item));
}

function countCategories<TItem extends ScreeningItem>(
  items: TItem[],
  responses: ScreeningResponses
) {
  return items.reduce(
    (counts, item) => {
      const category = responses[item.id]?.category;

      if (category === "INTERESTED") {
        counts.interested += 1;
      } else if (category === "UNSURE") {
        counts.unsure += 1;
      } else if (category === "NOT_INTERESTED") {
        counts.notInterested += 1;
      } else if (category === "UNKNOWN") {
        counts.unknown += 1;
      }

      return counts;
    },
    {
      interested: 0,
      unsure: 0,
      notInterested: 0,
      unknown: 0
    }
  );
}

function getSignal(
  counts: ReturnType<typeof countCategories>,
  itemCount: number,
  answered: boolean
): ScreeningSignal {
  if (!answered) {
    return "UNKNOWN";
  }

  if (counts.unknown >= Math.ceil(itemCount / 2)) {
    return "UNKNOWN";
  }

  if (counts.interested >= Math.ceil(itemCount * 0.7)) {
    return "HIGH";
  }

  if (counts.notInterested >= Math.ceil(itemCount * 0.7)) {
    return "LOW";
  }

  if (counts.unsure + counts.unknown >= Math.ceil(itemCount * 0.4)) {
    return "AMBIGUOUS";
  }

  if (counts.interested >= 2 && counts.notInterested >= 2) {
    return "AMBIGUOUS";
  }

  if (counts.interested > counts.notInterested) {
    return "HIGH";
  }

  if (counts.notInterested > counts.interested) {
    return "LOW";
  }

  return "AMBIGUOUS";
}

function getConfidenceFromCounts(
  counts: ReturnType<typeof countCategories>,
  itemCount: number,
  answered: boolean,
  usedValidation: boolean
): ScreeningConfidence {
  if (!answered) {
    return "LOW";
  }

  const max = Math.max(
    counts.interested,
    counts.notInterested,
    counts.unknown
  );
  const dominantRatio = max / itemCount;
  const ambiguityRatio = (counts.unsure + counts.unknown) / itemCount;

  if (dominantRatio >= 0.8 && ambiguityRatio <= 0.2) {
    return "HIGH";
  }

  if (dominantRatio >= 0.6 || (usedValidation && ambiguityRatio <= 0.35)) {
    return "MEDIUM";
  }

  return "LOW";
}

function getFlags(
  counts: ReturnType<typeof countCategories>,
  itemCount: number,
  input: {
    complete: boolean;
    confidence: ScreeningConfidence;
    shouldValidate: boolean;
  }
): ScreeningFlag[] {
  const flags: ScreeningFlag[] = [];

  if (counts.interested === itemCount && itemCount > 0) {
    flags.push("REPETITIVE_INTERESTED");
  }

  if (counts.notInterested === itemCount && itemCount > 0) {
    flags.push("REPETITIVE_NOT_INTERESTED");
  }

  if (counts.unknown >= Math.ceil(itemCount / 2)) {
    flags.push("HIGH_UNKNOWN");
  }

  if (counts.interested >= 2 && counts.notInterested >= 2) {
    flags.push("MIXED_PATTERN");
  }

  if (input.shouldValidate && !input.complete) {
    flags.push("VALIDATION_NEEDED");
  }

  if (
    input.shouldValidate &&
    input.complete &&
    input.confidence === "LOW"
  ) {
    flags.push("LOW_CONFIDENCE_AFTER_VALIDATION");
  }

  return flags;
}

function getNotes(input: {
  signal: ScreeningSignal;
  confidence: ScreeningConfidence;
  flags: ScreeningFlag[];
  shouldValidate: boolean;
  complete: boolean;
}) {
  const notes: string[] = [];

  if (input.signal === "HIGH") {
    notes.push("Aparece una tendencia favorable dentro del área explorada.");
  } else if (input.signal === "LOW") {
    notes.push("El área puede cerrarse como baja prioridad en esta exploración.");
  } else if (input.signal === "UNKNOWN") {
    notes.push("Predomina desconocimiento; conviene contextualizar en entrevista.");
  } else {
    notes.push("Se observa una tendencia mixta que requiere lectura del orientador.");
  }

  if (input.shouldValidate) {
    notes.push("Se agregaron preguntas de validación para confirmar o desafiar la tendencia.");
  }

  if (input.complete && input.confidence === "LOW") {
    notes.push("La confianza quedó baja aun después de la validación.");
  }

  if (input.flags.includes("REPETITIVE_INTERESTED")) {
    notes.push("Patrón repetitivo de interés; revisar deseabilidad o amplitud de criterio.");
  }

  if (input.flags.includes("REPETITIVE_NOT_INTERESTED")) {
    notes.push("Patrón repetitivo de rechazo; verificar fatiga o descarte global del área.");
  }

  return notes;
}
