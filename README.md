# agentic-account

[![npm version](https://img.shields.io/npm/v/agentic-account)](https://www.npmjs.com/package/agentic-account)
[![npm downloads per month](https://img.shields.io/npm/dm/agentic-account)](https://www.npmjs.com/package/agentic-account)
[![license](https://img.shields.io/npm/l/agentic-account)](https://www.npmjs.com/package/agentic-account)

[npm package](https://www.npmjs.com/package/agentic-account) · [CLI](#cli) · [Library](#library) · [Safety](#safety) · [Limits](#limits)

agentic-account is a local-first TypeScript library, CLI, and MCP server that plans and tracks brand social-account setup across ten platforms.
It guides the workflow — checklist, state machine, warmup plan — and routes every verification gate to a human instead of bypassing it.

## Install

```sh
npm install agentic-account
```

Two runtime dependencies: the MCP SDK and zod.

## Track your first account

```sh
agentic-account account create --platform instagram --handle acme --email-ref BRAND_EMAIL
agentic-account account checklist --id <id>
agentic-account account advance --id <id> --state needs-human
agentic-account account connect --id <id> --provider direct --credential-ref vault://team/instagram
agentic-account account warmup --id <id>
```

`advance` moves the account through `planned → creating → verifying → profile → connecting → warming → active`, with `paused` and `needs-human` wherever a platform demands proof a person is present.

## CLI

```sh
agentic-account account create --platform <name> --handle <handle> [--email-ref <ref>] [--phone-ref <ref>]
agentic-account account list
agentic-account account show --id <id>
agentic-account account checklist --id <id>
agentic-account account advance --id <id> --state <state>
agentic-account account connect --id <id> --provider <provider> --credential-ref <ref>
agentic-account account warmup --id <id>
agentic-account costs
agentic-account mcp
```

## Library

```ts
import { AccountRegistry, platformRequirements } from "agentic-account";

const registry = new AccountRegistry();
const account = registry.create({ platform: "instagram", handle: "acme", emailRef: "BRAND_EMAIL" });
registry.advance(account.id);                    // planned -> creating
registry.advance(account.id, "needs-human");     // CAPTCHA / SMS / identity check
```

`platformRequirements` covers Instagram, TikTok, X, LinkedIn, Facebook, Reddit, Threads, Bluesky, YouTube, and Pinterest — each platform's checklist, verification steps, and warmup guidance.

## MCP server

`agentic-account mcp` (or `npx agentic-account-mcp`) serves the registry on stdio: `account_create`, `account_list`, `account_show`, `account_checklist`, `account_advance`, `account_connect`, `account_warmup`, and `get_cost_report`.

## Use cases

- A launch agent tracks ten platform accounts for one brand and shows you exactly which step blocks each one.
- An ops script generates per-platform setup checklists instead of keeping them in a doc.
- A team vault keeps real credentials; the registry stores only `env:` and `vault://` references.

## Alternatives and related tools

- Social schedulers (Buffer, Hootsuite, Later) publish to accounts you already own; this pack tracks the work of getting those accounts created, verified, and connected.
- Password managers store credentials; agentic-account references them without storing secrets.

## Safety

- It does **not** create accounts, and does **not** bypass platform checks — CAPTCHA, SMS codes, and identity verification always resolve to `needs-human`.
- Credential fields accept only references such as `BRAND_EMAIL`, `env:BRAND_EMAIL`, or `vault://team/social`; raw secrets are rejected.
- Respect each platform's terms of service; some prohibit automated account creation entirely.

## Limits

- The in-process CLI registry suits guided sessions; use the library to persist records in your own storage.
- Checklists describe requirements as of the recorded platform version — platforms change their flows without notice.

## License

MIT
