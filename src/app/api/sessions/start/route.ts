import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http";
import { serializeSession, startOrResumeSession } from "@/lib/session-service";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{ code?: string; name?: string }>(request);
    if (!body) {
      return NextResponse.json(
        { error: "El cuerpo de la solicitud no es válido." },
        { status: 400 }
      );
    }

    const { session, resumed } = await startOrResumeSession({
      code: body.code ?? "",
      name: body.name ?? ""
    });
    const serialized = await serializeSession(session.id);

    return NextResponse.json({ session: serialized, resumed });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo iniciar el recorrido."
      },
      { status: 400 }
    );
  }
}
