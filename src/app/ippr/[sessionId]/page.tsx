import { notFound } from "next/navigation";
import { serializeSession } from "@/lib/session-service";
import { IpprRunner } from "./IpprRunner";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function IpprPage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await serializeSession(sessionId);

  if (!session) {
    notFound();
  }

  return <IpprRunner initialSession={session} />;
}
