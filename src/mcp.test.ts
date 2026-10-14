import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, test } from "vitest";
import { createMcpServer } from "./mcp.js";
const textOf = (x: unknown) => (x as { content: { text: string }[] }).content[0].text;
describe("MCP", () => { test("serves account tools", async () => { const [ct, st] = InMemoryTransport.createLinkedPair(); const server = createMcpServer(); await server.connect(st); const client = new Client({ name: "test", version: "1" }); await client.connect(ct); try { const names = (await client.listTools()).tools.map((x) => x.name); expect(names).toContain("account_create"); const result = await client.callTool({ name: "account_create", arguments: { platform: "instagram", handle: "acme", emailRef: "BRAND_EMAIL" } }); expect(JSON.parse(textOf(result))).toMatchObject({ state: "planned" }); } finally { await client.close(); await server.close(); } }); });
