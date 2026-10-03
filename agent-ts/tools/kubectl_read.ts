import { execFileSync } from "node:child_process";
import type { ToolTextResult } from "./types.js";

/** Salt okunur kubectl fiilleri. Yazma / mutate komutları bilinçli olarak yok. */
export const IZINLI = new Set(["get", "describe", "logs", "top", "events"]);

export function parseKubectlArgs(args: string): string[] {
  return String(args).split(/\s+/).filter(Boolean);
}

export function assertKubectlReadAllowed(args: string): string | null {
  const parts = parseKubectlArgs(args);
  if (!parts.length || !IZINLI.has(parts[0]) || /secret/i.test(args)) {
    return "İzin yok: sadece okuma (get/describe/logs/top/events), secret yok.";
  }
  return null;
}

/**
 * Cluster'a salt okunur kubectl çağrısı.
 * Güvenlik sınırı buradaki izin listesidir; headless SDK onay istemez.
 */
export function kubectlRead(
  args: string,
  options: {
    context?: string;
    timeoutMs?: number;
    maxBytes?: number;
  } = {},
): ToolTextResult {
  const denied = assertKubectlReadAllowed(args);
  if (denied) {
    return { content: [{ type: "text", text: denied }], isError: true };
  }

  const context = options.context ?? process.env.KUBE_CONTEXT ?? "kind-devops-demo";
  const timeoutMs = options.timeoutMs ?? 30_000;
  const maxBytes = options.maxBytes ?? 20_000;
  const parts = parseKubectlArgs(args);

  try {
    const out = execFileSync("kubectl", ["--context", context, ...parts], {
      encoding: "utf8",
      timeout: timeoutMs,
    });
    return out.slice(0, maxBytes);
  } catch (e: unknown) {
    const err = e as { stderr?: string; message?: string };
    const text = String(err.stderr ?? err.message ?? e).slice(0, 5_000);
    return { content: [{ type: "text", text }], isError: true };
  }
}
