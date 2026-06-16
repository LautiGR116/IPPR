import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http";
import { TOP_PREFERENCES_REQUIRED } from "@/lib/ippr-content";
import { prisma } from "@/lib/prisma";
import { recalculateModuleProgress } from "@/lib/session-service";

export async function PATCH(request: Request) {
  const body = await readJsonBody<{
    sessionId?: string;
    moduleId?: string;
    itemIds?: string[];
  }>(request);

  if (!body?.sessionId || !body.moduleId || !Array.isArray(body.itemIds)) {
    return NextResponse.json(
      { error: "Faltan datos para guardar preferencias." },
      { status: 400 }
    );
  }

  const uniqueItemIds = Array.from(new Set(body.itemIds)).slice(
    0,
    TOP_PREFERENCES_REQUIRED
  );

  const validItems = await prisma.testItem.findMany({
    where: {
      moduleId: body.moduleId,
      id: { in: uniqueItemIds }
    },
    select: { id: true }
  });

  if (validItems.length !== uniqueItemIds.length) {
    return NextResponse.json(
      { error: "Las preferencias no corresponden al campo actual." },
      { status: 400 }
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.topPreference.deleteMany({
      where: {
        sessionId: body.sessionId!,
        moduleId: body.moduleId!
      }
    });

    if (uniqueItemIds.length > 0) {
      await tx.topPreference.createMany({
        data: uniqueItemIds.map((itemId, index) => ({
          sessionId: body.sessionId!,
          moduleId: body.moduleId!,
          itemId,
          rank: index + 1
        }))
      });
    }

    await recalculateModuleProgress(tx, body.sessionId!, body.moduleId!);
  });

  return NextResponse.json({ ok: true });
}
