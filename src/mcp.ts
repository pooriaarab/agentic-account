import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { AccountRegistry } from "./account.js";
import { getCostReport } from "./core.js";
import { DEFAULT_BRAND } from "./index.js";
export interface McpDeps { registry?: AccountRegistry; }
const ok = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value) }] });
const fail = (e: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) }], isError: true as const });
export function createMcpServer(deps: McpDeps = {}): McpServer { const registry = deps.registry ?? new AccountRegistry(); const server = new McpServer({ name: DEFAULT_BRAND.command, version: DEFAULT_BRAND.version }); const tool = (name: string, description: string, inputSchema: Record<string, z.ZodTypeAny>, fn: (x: any) => unknown) => server.registerTool(name, { description, inputSchema }, async (x) => { try { return ok(await fn(x)); } catch (e) { return fail(e); } });
 tool("account_create", "Create a planned social account record using credential references only.", { platform: z.enum(["instagram","tiktok","x","linkedin","facebook","reddit","threads","bluesky","youtube","pinterest"]), handle: z.string(), emailRef: z.string().optional(), phoneRef: z.string().optional() }, (x) => registry.create(x));
 tool("account_list", "List account records.", {}, () => registry.list());
 tool("account_show", "Show one account including audit history.", { id: z.string() }, (x) => registry.get(x.id));
 tool("account_checklist", "List remaining setup steps; human-required steps are flagged.", { id: z.string() }, (x) => registry.checklist(x.id));
 tool("account_advance", "Advance an account state. Route CAPTCHA, SMS, and identity checks to needs-human.", { id: z.string(), state: z.enum(["planned","creating","verifying","profile","connecting","warming","active","paused","needs-human"]).optional() }, (x) => registry.advance(x.id, x.state));
 tool("account_connect", "Record a provider connection using a credential reference, never a secret.", { id: z.string(), provider: z.enum(["content-rabbit","postiz","zernio","direct","phone"]), credentialRef: z.string().optional() }, (x) => registry.connect(x.id, x.provider, x.credentialRef));
 tool("account_warmup", "Return a gradual weekly warm-up plan and daily action caps.", { id: z.string() }, (x) => registry.warmupPlan(x.id));
 server.registerTool("get_cost_report", { description: "Read session cost totals.", inputSchema: {} }, async () => ok(getCostReport())); return server; }
export async function startMcp(deps: McpDeps = {}): Promise<void> { const server = createMcpServer(deps); await server.connect(new StdioServerTransport()); }
