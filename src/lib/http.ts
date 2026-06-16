export async function readJsonBody<T>(request: Request): Promise<T | null> {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    return null;
  }
}
