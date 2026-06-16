import { SessionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCompletionState, serializeSession } from "@/lib/session-service";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ sessionId: string }>;
};

export async function POST(_request: Request, { params }: Params) {
  const { sessionId } = await params;
  const completion = await getCompletionState(sessionId);

  if (!completion.allModulesComplete) {
    return NextResponse.json(
      {
        error: "Todavía faltan campos por completar.",
        completion
      },
      { status: 409 }
    );
  }

  await prisma.testSession.update({
    where: { id: sessionId },
    data: {
      status: SessionStatus.COMPLETED,
      completedAt: new Date()
    }
  });

  return NextResponse.json({ session: await serializeSession(sessionId) });
}
