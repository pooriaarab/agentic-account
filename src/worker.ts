import { platformRequirements } from "./account.js";
import { VERSION } from "./version.js";
export interface WorkerEnv { PACK_NAME?: string; }
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
export default { async fetch(request: Request, env: WorkerEnv): Promise<Response> { const url = new URL(request.url); if (request.method === "GET" && url.pathname === "/health") return json({ ok: true, pack: env.PACK_NAME ?? "agentic-account", version: VERSION }); if (request.method === "GET" && url.pathname === "/requirements") return json(platformRequirements); return json({ error: "not found" }, 404); } };
