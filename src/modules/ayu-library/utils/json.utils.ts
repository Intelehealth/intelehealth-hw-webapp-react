export function safeJsonParse(json: string) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}
