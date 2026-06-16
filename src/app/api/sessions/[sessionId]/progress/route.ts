import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ sessionId: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const { sessionId } = await params;
  const body = await readJsonBody<{ currentModuleOrder?: number }>(request);

  if (
    !body ||
    typeof body.currentModuleOrder !== "number" ||
    body.currentModuleOrder < 0
  ) {
    return NextResponse.json(
      { error: "El módulo actual no es válido." },
      { status: 400 }
    );
  }

  const session = await prisma.testSession.update({
    where: { id: sessionId },
    data: { currentModuleOrder: body.currentModuleOrder }
  });

  return NextResponse.json({
    sessionId: session.id,
    currentModuleOrder: session.currentModuleOrder
  });
}
