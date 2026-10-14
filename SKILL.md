---
name: agentic-account
description: Set up and track brand social accounts and their connections. Keywords: accounts,social,setup,registry,agentic-suite,cli,mcp.
---

# agentic-account

Set up and track brand social accounts and their connections.

## Use the SDK

```js
import { summarizeText, dispatchText } from "agentic-account";

summarizeText("some text");
await dispatchText("some text", { dryRun: true });
```

## Use the CLI

```sh
agentic-account summary --text "some text"
agentic-account dispatch --text "some text" --dry-run
```

## Use the MCP server

Start the server with `agentic-account mcp`. Call `summarize_text`
for stats, `dispatch_text` for routes, `get_cost_report` for costs.

## Rules

- Preview each route with dry run first.
- Report guard denials and adapter errors as failures.
- Read the cost report at the end.
