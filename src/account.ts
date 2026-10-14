import { randomUUID } from "node:crypto";

export const PLATFORMS = [
  "instagram", "tiktok", "x", "linkedin", "facebook", "reddit", "threads", "bluesky", "youtube", "pinterest",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const ACCOUNT_STATES = [
  "planned", "creating", "verifying", "profile", "connecting", "warming", "active", "paused", "needs-human",
] as const;
export type AccountState = (typeof ACCOUNT_STATES)[number];
export const CONNECTION_PROVIDERS = ["content-rabbit", "postiz", "zernio", "direct", "phone"] as const;
export type ConnectionProvider = (typeof CONNECTION_PROVIDERS)[number];

export interface PlatformRequirement {
  platform: Platform;
  needs: ("email" | "phone")[];
  verification: string[];
  profileFields: string[];
  connectionNotes: string;
}

export const platformRequirements: Record<Platform, PlatformRequirement> = {
  instagram: { platform: "instagram", needs: ["email", "phone"], verification: ["email or SMS confirmation", "CAPTCHA may require a human"], profileFields: ["handle", "display name", "bio", "profile image"], connectionNotes: "Use a Meta developer app and OAuth for supported publishing; complete any checkpoint manually." },
  tiktok: { platform: "tiktok", needs: ["email", "phone"], verification: ["email or SMS confirmation", "identity checks may require a human"], profileFields: ["handle", "display name", "bio", "profile image"], connectionNotes: "Use TikTok for Developers OAuth where available; human approval may be required." },
  x: { platform: "x", needs: ["email"], verification: ["email confirmation", "phone or CAPTCHA may be requested"], profileFields: ["handle", "display name", "bio", "profile image"], connectionNotes: "Create an X developer app and use OAuth; keep API keys in a vault reference." },
  linkedin: { platform: "linkedin", needs: ["email"], verification: ["email confirmation", "identity verification may require a human"], profileFields: ["name", "headline", "about", "profile image"], connectionNotes: "Use approved LinkedIn OAuth/app access; organization permissions can require an admin." },
  facebook: { platform: "facebook", needs: ["email", "phone"], verification: ["email or SMS confirmation", "identity checks may require a human"], profileFields: ["name", "about", "category", "profile image"], connectionNotes: "Use a Meta developer app and OAuth; page roles and review can require a human." },
  reddit: { platform: "reddit", needs: ["email"], verification: ["email confirmation", "CAPTCHA may require a human"], profileFields: ["username", "display name", "avatar", "about"], connectionNotes: "Create a Reddit developer app and use OAuth; follow subreddit rules." },
  threads: { platform: "threads", needs: ["email"], verification: ["Instagram-linked login", "CAPTCHA may require a human"], profileFields: ["handle", "bio", "profile image"], connectionNotes: "Use Meta/Threads OAuth and ensure the linked Instagram account is ready." },
  bluesky: { platform: "bluesky", needs: ["email"], verification: ["email confirmation"], profileFields: ["handle", "display name", "description", "avatar"], connectionNotes: "Use Bluesky app passwords or OAuth when supported; store only a credential reference." },
  youtube: { platform: "youtube", needs: ["email", "phone"], verification: ["Google account verification", "phone or identity checks may require a human"], profileFields: ["channel name", "description", "channel image", "banner"], connectionNotes: "Use Google Cloud OAuth and YouTube Data API; channel verification is completed by a human." },
  pinterest: { platform: "pinterest", needs: ["email"], verification: ["email confirmation", "business verification may require a human"], profileFields: ["business name", "bio", "website", "profile image"], connectionNotes: "Use Pinterest developer OAuth/API access where approved." },
};

export interface Connection { provider: ConnectionProvider; status: "pending" | "connected" | "failed"; credentialRef?: string; updatedAt: string; }
export interface AuditEntry { at: string; action: string; from?: AccountState; to?: AccountState; detail?: string; }
export interface Account { id: string; platform: Platform; handle: string; state: AccountState; emailRef?: string; phoneRef?: string; profileComplete: boolean; connections: Connection[]; audit: AuditEntry[]; createdAt: string; updatedAt: string; }
export interface CreateAccountInput { platform: Platform; handle: string; emailRef?: string; phoneRef?: string; }

function now(): string { return new Date().toISOString(); }
function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function assertPlatform(platform: string): asserts platform is Platform { if (!PLATFORMS.includes(platform as Platform)) throw new Error(`unsupported platform "${platform}"`); }
function assertProvider(provider: string): asserts provider is ConnectionProvider { if (!CONNECTION_PROVIDERS.includes(provider as ConnectionProvider)) throw new Error(`unsupported provider "${provider}"`); }
export function assertCredentialRef(value: string | undefined, field: string): void {
  if (value === undefined) return;
  const valid = /^(?:[A-Z][A-Z0-9_]*|env:[A-Z][A-Z0-9_]*|vault:\/\/[^\s]+|secret:\/\/[^\s]+)$/.test(value);
  if (!valid || /(?:password|token|secret|sk-|ghp_)/i.test(value.replace(/^(env:|vault:\/\/|secret:\/\/)/, "")) && !value.startsWith("vault://") && !value.startsWith("secret://")) {
    throw new Error(`${field} must be a credential reference (an ENV_VAR name, env:ENV_VAR, or vault:// path), not a secret value`);
  }
}

export class AccountRegistry {
  private readonly accounts = new Map<string, Account>();
  create(input: CreateAccountInput): Account {
    assertPlatform(input.platform);
    if (!input.handle.trim()) throw new Error("handle must not be empty");
    assertCredentialRef(input.emailRef, "emailRef"); assertCredentialRef(input.phoneRef, "phoneRef");
    const createdAt = now();
    const account: Account = { id: randomUUID(), platform: input.platform, handle: input.handle.trim(), state: "planned", emailRef: input.emailRef, phoneRef: input.phoneRef, profileComplete: false, connections: [], audit: [{ at: createdAt, action: "created", to: "planned" }], createdAt, updatedAt: createdAt };
    this.accounts.set(account.id, account); return clone(account);
  }
  list(): Account[] { return [...this.accounts.values()].map(clone); }
  get(id: string): Account { const account = this.accounts.get(id); if (!account) throw new Error(`account "${id}" not found`); return clone(account); }
  advance(id: string, target?: AccountState): Account {
    const account = this.require(id); const from = account.state;
    const next = target ?? this.nextState(account);
    if (!ACCOUNT_STATES.includes(next)) throw new Error(`unsupported state "${next}"`);
    this.validateTransition(account, next);
    account.state = next; account.updatedAt = now(); account.audit.push({ at: account.updatedAt, action: "advanced", from, to: next }); return clone(account);
  }
  markProfileComplete(id: string): Account { const a = this.require(id); a.profileComplete = true; a.updatedAt = now(); a.audit.push({ at: a.updatedAt, action: "profile marked complete", detail: "Profile fields are human-confirmed." }); return clone(a); }
  connect(id: string, provider: ConnectionProvider, credentialRef?: string): Account {
    assertProvider(provider); assertCredentialRef(credentialRef, "credentialRef"); const account = this.require(id);
    if (!["connecting", "warming", "active"].includes(account.state)) throw new Error("connections can be recorded only while connecting, warming, or active");
    const connection: Connection = { provider, status: "connected", credentialRef, updatedAt: now() };
    const index = account.connections.findIndex((item) => item.provider === provider); if (index >= 0) account.connections[index] = connection; else account.connections.push(connection);
    account.updatedAt = connection.updatedAt; account.audit.push({ at: connection.updatedAt, action: "connected", detail: `${provider} connected` }); return clone(account);
  }
  checklist(id: string): { account: Account; steps: { key: string; label: string; done: boolean; human: boolean }[] } {
    const account = this.get(id); const req = platformRequirements[account.platform]; const connected = account.connections.some((c) => c.status === "connected");
    return { account, steps: [
      { key: "contact", label: `Provide ${req.needs.join(" or ")} credential reference`, done: req.needs.some((need) => need === "email" ? !!account.emailRef : !!account.phoneRef), human: false },
      { key: "create", label: "Create the account in the platform UI", done: !["planned", "creating"].includes(account.state), human: true },
      { key: "verify", label: req.verification.join("; "), done: !["planned", "creating", "verifying", "needs-human"].includes(account.state), human: true },
      { key: "profile", label: `Complete profile: ${req.profileFields.join(", ")}`, done: account.profileComplete, human: true },
      { key: "connect", label: req.connectionNotes, done: connected, human: true },
      { key: "warm", label: "Follow the weekly warm-up plan before full activity", done: ["active"].includes(account.state), human: false },
    ] };
  }
  warmupPlan(id: string): { account: Account; weeks: { week: number; dailyActionCap: number; actions: string[] }[] } { const account = this.get(id); return { account, weeks: [ { week: 1, dailyActionCap: 3, actions: ["complete profile", "browse and follow relevant accounts", "publish up to 1 original post"] }, { week: 2, dailyActionCap: 6, actions: ["reply thoughtfully", "publish up to 2 original posts", "avoid repetitive actions"] }, { week: 3, dailyActionCap: 10, actions: ["increase normal engagement", "publish up to 3 original posts", "review platform policies"] }, { week: 4, dailyActionCap: 15, actions: ["operate at a measured normal cadence", "monitor account health", "do not automate prohibited actions"] } ] }; }
  private require(id: string): Account { const account = this.accounts.get(id); if (!account) throw new Error(`account "${id}" not found`); return account; }
  private nextState(account: Account): AccountState { const path: AccountState[] = ["planned", "creating", "verifying", "profile", "connecting", "warming", "active"]; const index = path.indexOf(account.state); return index < 0 || index === path.length - 1 ? account.state : path[index + 1]; }
  private validateTransition(account: Account, next: AccountState): void {
    if (next === account.state) return;
    if (next === "paused") return; if (next === "needs-human") return;
    if (account.state === "needs-human" && next === "verifying") return;
    const order: AccountState[] = ["planned", "creating", "verifying", "profile", "connecting", "warming", "active"];
    const from = order.indexOf(account.state), to = order.indexOf(next);
    if (from < 0 || to !== from + 1) throw new Error(`invalid transition from ${account.state} to ${next}`);
    const req = platformRequirements[account.platform];
    if (next === "creating" && !req.needs.some((need) => need === "email" ? account.emailRef : account.phoneRef)) throw new Error(`creating requires an ${req.needs.join(" or ")} credential reference`);
    if (next === "profile" && account.state === "verifying") return;
    if (next === "connecting" && !account.profileComplete) throw new Error("connecting requires profileComplete; a human must complete profile fields first");
    if (next === "warming" && account.connections.length === 0) throw new Error("warming requires at least one connected provider");
  }
}
