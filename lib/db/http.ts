import { ZodError } from "zod";

export function databaseUnavailable() {
  return Response.json({ error: "DATABASE_NOT_CONFIGURED", message: "PostgreSQL doit être connecté pour utiliser ce module." }, { status: 503 });
}

export function apiError(error: unknown) {
  if (error instanceof ZodError) return Response.json({ error: "VALIDATION_ERROR", issues: error.issues }, { status: 422 });
  if (error instanceof SyntaxError) return Response.json({ error: "INVALID_JSON" }, { status: 400 });
  console.error("NOVA API error", error);
  return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
}
