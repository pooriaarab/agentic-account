# agentic-account

A local-first pack for planning, tracking, and safely guiding brand social-account setup. It does not create accounts or bypass platform checks: CAPTCHA, SMS codes, and identity checks are explicitly routed to `needs-human`.

## Library

```ts
import { AccountRegistry, platformRequirements } from "agentic-account";
const registry = new AccountRegistry();
const account = registry.create({ platform: "instagram", handle: "acme", emailRef: "BRAND_EMAIL" });
registry.advance(account.id); // planned -> creating
registry.advance(account.id); // creating -> verifying
registry.advance(account.id, "needs-human"); // CAPTCHA/SMS/identity check
```

`platformRequirements` covers Instagram, TikTok, X, LinkedIn, Facebook, Reddit, Threads, Bluesky, YouTube, and Pinterest. Credential fields accept only references such as `BRAND_EMAIL`, `env:BRAND_EMAIL`, or `vault://team/social`; raw secrets are rejected.

## CLI

```sh
agentic-account account create --platform instagram --handle acme --email-ref BRAND_EMAIL
agentic-account account list
agentic-account account checklist --id <id>
agentic-account account advance --id <id> --state needs-human
agentic-account account connect --id <id> --provider direct --credential-ref vault://team/instagram
agentic-account account warmup --id <id>
agentic-account costs
agentic-account mcp
```

The in-process CLI registry is intended for guided sessions; use the library to persist records in your own storage.

## MCP tools

- `account_create`, `account_list`, `account_show`
- `account_checklist`, `account_advance`, `account_connect`, `account_warmup`
- `get_cost_report`

All three interfaces expose the same setup workflow and state machine: `planned → creating → verifying → profile → connecting → warming → active`, plus `paused` and `needs-human`.
