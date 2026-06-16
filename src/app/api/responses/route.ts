import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http";
import {
  isResponseCategory,
  recalculateModuleProgress,
  responseValueByCategory
} from "@/lib/session-service";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const body = await readJsonBody<{
    sessionId?: string;
    itemId?: string;
    category?: string;
  }>(request);

  if (!body?.sessionId || !body.itemId || !body.category) {
    return NextResponse.json(
      { error: "Faltan datos para guardar la respuesta." },
      { status: 400 }
    );
  }

  if (!isResponseCategory(body.category)) {
    return NextResponse.json(
      { error: "La categoría de respuesta no es válida." },
      { status: 400 }
    );
  }

  const item = await prisma.testItem.findUnique({
    where: { id: body.itemId },
    select: { id: true, moduleId: true }
  });

  if (!item) {
    return NextResponse.json(
      { error: "No se encontró el ítem." },
      { status: 404 }
    );
  }

  const numericValue = responseValueByCategory.get(body.category) ?? 0;

  await prisma.$transaction(async (tx) => {
    await tx.itemResponse.upsert({
      where: {
        sessionId_itemId: {
          sessionId: body.sessionId!,
          itemId: body.itemId!
        }
      },
      update: {
        category: body.category!,
        numericValue,
        answeredAt: new Date()
      },
      create: {
        sessionId: body.sessionId!,
        itemId: body.itemId!,
        category: body.category!,
        numericValue
      }
    });

    await recalculateModuleProgress(tx, body.sessionId!, item.moduleId);
  });

  return NextResponse.json({ ok: true });
}
