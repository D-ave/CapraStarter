// Strips <cite index="...">...</cite> tags the LLM injects into prose fields.
// These are citation markers from grounded search that should not appear in the UI.
export function stripCites(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/<cite[^>]*>|<\/cite>/g, "").trim();
}
