export function safeJsonParse(json: string) {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('JSON parse failed', error);
    return null;
  }
}
