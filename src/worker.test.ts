import { describe, expect, test } from "vitest";
import worker from "./worker.js";
describe("worker", () => { test("health reports pack", async () => { const response = await worker.fetch(new Request("https://test/health"), { PACK_NAME: "probe" }); expect(await response.json()).toMatchObject({ ok: true, pack: "probe" }); }); test("requirements are available", async () => { const response = await worker.fetch(new Request("https://test/requirements"), {}); expect(response.status).toBe(200); }); });
