import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Agent, type SDKCustomTool, type ToolName } from "@cursor/sdk";
import { kubectlRead } from "./tools/kubectl_read.js";
import { promQuery } from "./tools/prom_query.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Demo varsayılanı: shell/edit/write kapalı; read/grep hâlâ açık kalabilir.
 * Müşteri demosu için AGENT_STRICT_TOOLS=1 → yalnızca custom MCP araçları.
 */
const DEMO_DISALLOWED: ToolName[] = ["shell", "edit", "write", "delete"];
const STRICT_TOOLS: ToolName[] = ["mcp"];

const kubectlReadTool: SDKCustomTool = {
  description:
    "Salt okunur kubectl. args: get/describe/logs/top/events ile başlayan argümanlar. secret yasak.",
  inputSchema: {
    type: "object",
    properties: {
      args: {
        type: "string",
        description: 'Örn: "get pods -n tenant-a" veya "describe pod foo -n tenant-a"',
      },
    },
    required: ["args"],
  },
  annotations: {
    title: "kubectl_read",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  async execute(args) {
    return kubectlRead(String(args.args ?? ""));
  },
};

const promQueryTool: SDKCustomTool = {
  description:
    "Prometheus instant query. PromQL ifadesi ver; salt okunur metrik sonucu döner.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "PromQL ifadesi" },
    },
    required: ["query"],
  },
  annotations: {
    title: "prom_query",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  async execute(args) {
    return promQuery(String(args.query ?? ""));
  },
};

function loadSkill(name: string): string {
  return readFileSync(join(__dirname, "skills", name), "utf8");
}

function requireApiKey(): string {
  const key = process.env.CURSOR_API_KEY;
  if (!key) {
    console.error(
      "CURSOR_API_KEY yok. Dashboard → API Keys → New API Key ile oluşturup export edin.",
    );
    process.exit(1);
  }
  return key;
}

const namespace = process.env.TENANT_NS ?? "tenant-a";
const modelId = process.env.CURSOR_MODEL ?? "composer-2.5";
const strict = process.env.AGENT_STRICT_TOOLS === "1";
const skill = loadSkill("sre-readonly.md");

const prompt = [
  skill.trim(),
  "",
  `${namespace} namespace'inde ne bozuk ve neden? Salt okuma ile kök nedeni kanıtlarla açıkla.`,
].join("\n");

const apiKey = requireApiKey();

await using agent = await Agent.create({
  apiKey,
  model: { id: modelId },
  ...(strict
    ? { tools: STRICT_TOOLS }
    : { disallowedTools: DEMO_DISALLOWED }),
  local: {
    cwd: process.cwd(),
    customTools: {
      kubectl_read: kubectlReadTool,
      prom_query: promQueryTool,
    },
  },
});

const run = await agent.send(prompt);
const result = await run.wait();

console.log(result.result ?? "(boş sonuç)");
console.log("---");
console.log(
  "token:",
  result.usage?.totalTokens,
  "süre(ms):",
  result.durationMs,
  "status:",
  result.status,
);

try {
  const billed = await agent.getUsage();
  const cost = billed.cost;
  console.log(
    "billed tokens:",
    billed.usage.totalTokens,
    "chargedCents:",
    cost?.chargedCents,
    "rawCostCents:",
    cost?.rawCostCents,
  );
} catch (e: unknown) {
  const message = e instanceof Error ? e.message : String(e);
  console.log("getUsage alınamadı:", message);
}
