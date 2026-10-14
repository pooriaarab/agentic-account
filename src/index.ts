export { VERSION } from "./version.js";
export { defineBrand, createLogger, GuardError, VendorError, createGuards, LocalRouterAdapter, HttpRouterAdapter, recordCost, getCostReport, resetCosts, createDryRunResult, dispatchText, summarizeText } from "./core.js";
export type { BrandConfig, LogLevel, Logger, LoggerOptions, CapsConfig, QuietHoursConfig, GuardsConfig, Guards, DispatchReceipt, RouterAdapter, HttpRouterOptions, CostEntry, CostReport, DispatchOptions, DispatchResult, TopWord, TextSummary, SummarizeOptions } from "./core.js";
export { AccountRegistry, platformRequirements, PLATFORMS, ACCOUNT_STATES, CONNECTION_PROVIDERS, assertCredentialRef } from "./account.js";
export type { Platform, AccountState, ConnectionProvider, PlatformRequirement, Connection, AuditEntry, Account, CreateAccountInput } from "./account.js";
import { defineBrand, type BrandConfig } from "./core.js";
import { VERSION } from "./version.js";
export const DEFAULT_BRAND: BrandConfig = defineBrand({ name: "Agentic Account", command: "agentic-account", description: "Set up and track brand social accounts and their connections.", keywords: ["accounts", "social", "setup", "registry", "cli", "mcp"], version: VERSION });
