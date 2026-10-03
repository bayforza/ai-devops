import type { ToolTextResult } from "./types.js";

/**
 * Prometheus anlık sorgu aracı (iskelet).
 * Agent runtime'dan bağımsız; Cursor SDK / Claude Agent SDK / ham API'ye taşınabilir.
 */
export async function promQuery(
  query: string,
  options: { baseUrl?: string; timeoutMs?: number } = {},
): Promise<ToolTextResult> {
  const baseUrl = options.baseUrl ?? process.env.PROM_URL;
  if (!baseUrl) {
    return {
      content: [
        {
          type: "text",
          text: "PROM_URL tanımlı değil. Örn: http://localhost:9090 (make grafana / port-forward sonrası).",
        },
      ],
      isError: true,
    };
  }

  const url = new URL("/api/v1/query", baseUrl);
  url.searchParams.set("query", query);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const body = await res.text();
    if (!res.ok) {
      return {
        content: [{ type: "text", text: `Prometheus ${res.status}: ${body.slice(0, 2000)}` }],
        isError: true,
      };
    }
    return body.slice(0, 20_000);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { content: [{ type: "text", text: message.slice(0, 5_000) }], isError: true };
  } finally {
    clearTimeout(timer);
  }
}
