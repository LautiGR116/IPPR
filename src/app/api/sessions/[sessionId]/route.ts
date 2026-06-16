import { NextResponse } from "next/server";
import { serializeSession } from "@/lib/session-service";

type Params = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { sessionId } = await params;
  const session = await serializeSession(sessionId);

  if (!session) {
    return NextResponse.json(
      { error: "No se encontró la sesión." },
      { status: 404 }
    );
  }

  return NextResponse.json({ session });
}
