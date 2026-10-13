export function safeErrorMetadata(error: unknown) {
  if (!error || typeof error !== "object") {
    return { errorType: "unknown" };
  }

  const value = error as {
    name?: unknown;
    status?: unknown;
    statusCode?: unknown;
    response?: { status?: unknown };
  };
  const status = [value.status, value.statusCode, value.response?.status]
    .find((candidate) => typeof candidate === "number" && candidate >= 100 && candidate <= 599);

  return {
    errorType: typeof value.name === "string" ? value.name.slice(0, 64) : "unknown",
    ...(typeof status === "number" ? { status } : {}),
  };
}
