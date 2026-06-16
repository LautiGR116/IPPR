import { ModuleStatus, Prisma, SessionStatus } from "@prisma/client";
import {
  IPPR_TEST,
  RESPONSE_OPTIONS,
  ResponseCategory
} from "@/lib/ippr-content";
import { prisma } from "@/lib/prisma";
import { getScreeningPlan } from "@/lib/screening";

export const responseValueByCategory = new Map(
  RESPONSE_OPTIONS.map((option) => [option.category, option.numericValue])
);

export function normalizeParticipantCode(code: string) {
  return code.trim().replace(/\s+/g, "-").toUpperCase();
}

export function isResponseCategory(value: string): value is ResponseCategory {
  return responseValueByCategory.has(value as ResponseCategory);
}

export async function getIpprTestOrThrow() {
  const test = await prisma.test.findUnique({
    where: { slug: IPPR_TEST.slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { items: { orderBy: { order: "asc" } } }
      }
    }
  });

  if (!test) {
    throw new Error("IPPR seed is missing. Run npm run db:seed.");
  }

  return test;
}

export async function createProgressRows(sessionId: string, testId: string) {
  const modules = await prisma.testModule.findMany({
    where: { testId },
    select: { id: true }
  });

  for (const module of modules) {
    await prisma.moduleProgress.upsert({
      where: {
        sessionId_moduleId: {
          sessionId,
          moduleId: module.id
        }
      },
      update: {},
      create: {
        sessionId,
        moduleId: module.id
      }
    });
  }
}

export async function startOrResumeSession(input: {
  code: string;
  name: string;
}) {
  const code = normalizeParticipantCode(input.code);
  const name = input.name.trim();

  if (!code || !name) {
    throw new Error("El código y el nombre son obligatorios.");
  }

  const test = await getIpprTestOrThrow();

  const participant = await prisma.participant.upsert({
    where: { code },
    update: { name },
    create: { code, name }
  });

  const activeSession = await prisma.testSession.findFirst({
    where: {
      participantId: participant.id,
      testId: test.id,
      status: SessionStatus.ACTIVE
    },
    orderBy: { startedAt: "desc" }
  });

  if (activeSession) {
    await createProgressRows(activeSession.id, test.id);
    await refreshSessionProgress(activeSession.id);
    const currentModuleOrder = await findResumeModuleOrder(activeSession.id);
    const session = await prisma.testSession.update({
      where: { id: activeSession.id },
      data: { currentModuleOrder }
    });
    return { participant, session, resumed: true };
  }

  const session = await prisma.testSession.create({
    data: {
      participantId: participant.id,
      testId: test.id,
      status: SessionStatus.ACTIVE
    }
  });

  await createProgressRows(session.id, test.id);

  return { participant, session, resumed: false };
}

export async function findResumeModuleOrder(sessionId: string) {
  const session = await prisma.testSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      progress: {
        include: { module: true },
        orderBy: { module: { order: "asc" } }
      }
    }
  });

  const firstIncomplete = session.progress.find(
    (progress) => progress.status !== ModuleStatus.COMPLETED
  );

  return firstIncomplete?.module.order ?? session.currentModuleOrder;
}

export async function recalculateModuleProgress(
  tx: Prisma.TransactionClient,
  sessionId: string,
  moduleId: string
) {
  const [items, responses, topCount] = await Promise.all([
    tx.testItem.findMany({
      where: { moduleId },
      select: { id: true, order: true },
      orderBy: { order: "asc" }
    }),
    tx.itemResponse.findMany({
      where: {
        sessionId,
        item: { moduleId }
      },
      select: { itemId: true, category: true }
    }),
    tx.topPreference.count({
      where: {
        sessionId,
        moduleId
      }
    })
  ]);

  const responseByItemId = Object.fromEntries(
    responses.map((response) => [
      response.itemId,
      { category: response.category as ResponseCategory }
    ])
  );
  const plan = getScreeningPlan({ items }, responseByItemId);
  const answeredCount = plan.answeredRequiredCount;
  const isComplete = plan.complete;

  const status = isComplete
    ? ModuleStatus.COMPLETED
    : answeredCount > 0 || topCount > 0
      ? ModuleStatus.IN_PROGRESS
      : ModuleStatus.NOT_STARTED;

  return tx.moduleProgress.upsert({
    where: {
      sessionId_moduleId: {
        sessionId,
        moduleId
      }
    },
    update: {
      answeredCount,
      topCount,
      status,
      completedAt: isComplete ? new Date() : null
    },
    create: {
      sessionId,
      moduleId,
      answeredCount,
      topCount,
      status,
      completedAt: isComplete ? new Date() : null
    }
  });
}

export async function refreshSessionProgress(sessionId: string) {
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: {
      test: {
        include: {
          modules: {
            select: { id: true },
            orderBy: { order: "asc" }
          }
        }
      }
    }
  });

  if (!session) {
    return;
  }

  await createProgressRows(sessionId, session.testId);
  await prisma.$transaction(async (tx) => {
    for (const module of session.test.modules) {
      await recalculateModuleProgress(tx, sessionId, module.id);
    }
  });
}

export async function serializeSession(sessionId: string) {
  await refreshSessionProgress(sessionId);

  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: {
      participant: true,
      test: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: {
              items: { orderBy: { order: "asc" } }
            }
          }
        }
      },
      responses: true,
      topPicks: true,
      progress: true
    }
  });

  if (!session) {
    return null;
  }

  return {
    id: session.id,
    status: session.status,
    currentModuleOrder: session.currentModuleOrder,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    participant: {
      id: session.participant.id,
      code: session.participant.code,
      name: session.participant.name
    },
    test: {
      id: session.test.id,
      slug: session.test.slug,
      name: session.test.name,
      version: session.test.version,
      modules: session.test.modules.map((module) => ({
        id: module.id,
        key: module.key,
        title: module.title,
        icon: module.icon,
        order: module.order,
        items: module.items.map((item) => ({
          id: item.id,
          key: item.key,
          prompt: item.prompt,
          order: item.order
        }))
      }))
    },
    responses: Object.fromEntries(
      session.responses.map((response) => [
        response.itemId,
        {
          category: response.category as ResponseCategory,
          numericValue: response.numericValue,
          answeredAt: response.answeredAt.toISOString()
        }
      ])
    ),
    topPicks: session.topPicks.map((pick) => ({
      moduleId: pick.moduleId,
      itemId: pick.itemId,
      rank: pick.rank
    })),
    progress: Object.fromEntries(
      session.progress.map((progress) => [
        progress.moduleId,
        {
          status: progress.status,
          answeredCount: progress.answeredCount,
          topCount: progress.topCount,
          completedAt: progress.completedAt?.toISOString() ?? null
        }
      ])
    )
  };
}

export async function getCompletionState(sessionId: string) {
  await refreshSessionProgress(sessionId);

  const progress = await prisma.moduleProgress.findMany({
    where: { sessionId },
    include: { module: true }
  });

  const allModulesComplete =
    progress.length > 0 &&
    progress.every((item) => item.status === ModuleStatus.COMPLETED);

  return {
    allModulesComplete,
    completedModules: progress.filter(
      (item) => item.status === ModuleStatus.COMPLETED
    ).length,
    totalModules: progress.length
  };
}
