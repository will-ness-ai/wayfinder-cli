import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { CliEnv } from './env.js';

/** The three config scopes, nearest first. Local wins over project, project over user. */
export type Scope = 'local' | 'project' | 'user';

/** The tracker key, resolved wholesale from one scope: value and doc together. */
export interface ResolvedTracker {
  /** The free-text tracker value, for example `github cli`. */
  value: string;
  /** An attached doc path, stored verbatim and resolved against {@link configDir}. */
  doc?: string;
  /** The scope that supplied the tracker. */
  scope: Scope;
  /** The directory of the config file that supplied it, for `--doc` path resolution. */
  configDir: string;
}

/** One effective ticket-skill registration, resolved wholesale from its nearest scope. */
export interface ResolvedTicketSkill {
  name: string;
  when: string;
  scope: Scope;
}

/** The effective config for this working directory: tracker plus the ticket-skill union. */
export interface ResolvedConfig {
  tracker?: ResolvedTracker;
  ticketSkills: ResolvedTicketSkill[];
}

interface RawConfig {
  tracker?: { value?: string; doc?: string };
  ticketSkills?: Record<string, { when: string } | null>;
}

interface ScopeSource {
  scope: Scope;
  config: RawConfig;
  configDir: string;
}

/** Config scopes in precedence order: nearest (local) first. */
const SCOPE_ORDER: Scope[] = ['local', 'project', 'user'];

/**
 * Resolve the effective config for a working directory.
 *
 * `tracker` resolves **wholesale**: the nearest scope that names a tracker value
 * supplies both the value and its doc, so the two never come from different
 * scopes. `ticketSkills` resolves as a **union across scopes**, keyed by name;
 * each name resolves wholesale by the same nearest-scope rule, and a `null`
 * entry is a tombstone that hides an inherited registration.
 */
export function resolveConfig(env: CliEnv): ResolvedConfig {
  const sources = readScopes(env);
  return {
    tracker: resolveTracker(sources),
    ticketSkills: resolveTicketSkills(sources),
  };
}

/** The config file path for each scope, given the injected environment. */
export function scopeFiles(env: CliEnv): Record<Scope, string> {
  return {
    local: join(env.cwd, '.wayfinder', 'local.json'),
    project: join(env.cwd, '.wayfinder', 'config.json'),
    user: join(userConfigHome(env), 'wayfinder', 'config.json'),
  };
}

function readScopes(env: CliEnv): ScopeSource[] {
  const files = scopeFiles(env);
  return SCOPE_ORDER.map((scope) => ({
    scope,
    config: readConfigFile(files[scope]),
    configDir: dirname(files[scope]),
  }));
}

/** The user-scope config directory: `$XDG_CONFIG_HOME` when set, else `~/.config`. */
function userConfigHome(env: CliEnv): string {
  const xdg = env.env.XDG_CONFIG_HOME;
  return xdg && xdg.length > 0 ? xdg : join(env.home, '.config');
}

/** Read one config file. A missing or unparseable file resolves to an empty config. */
function readConfigFile(path: string): RawConfig {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    return {};
  }
  try {
    return narrowConfig(JSON.parse(raw));
  } catch {
    return {};
  }
}

/**
 * Narrow parsed JSON to the config shape. A config file is hand-edited, so its
 * contents are input, not a promise: every key is checked rather than asserted,
 * and one of the wrong type is dropped. Resolution stays tolerant — a broken key
 * must never crash a read command — so a bad value degrades to absent, and a
 * `when` that is not a sentence degrades to the empty one that renders visibly.
 */
function narrowConfig(parsed: unknown): RawConfig {
  if (!isRecord(parsed)) return {};
  const config: RawConfig = {};

  const { tracker } = parsed;
  if (isRecord(tracker)) {
    config.tracker = {
      ...(typeof tracker.value === 'string' ? { value: tracker.value } : {}),
      ...(typeof tracker.doc === 'string' ? { doc: tracker.doc } : {}),
    };
  }

  const skills = parsed.ticketSkills;
  if (isRecord(skills)) {
    const narrowed: Record<string, { when: string } | null> = {};
    for (const [name, entry] of Object.entries(skills)) {
      if (entry === null) {
        narrowed[name] = null;
      } else if (isRecord(entry)) {
        narrowed[name] = { when: typeof entry.when === 'string' ? entry.when : '' };
      }
    }
    config.ticketSkills = narrowed;
  }

  return config;
}

/** A plain JSON object — not null, and not an array. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function resolveTracker(sources: ScopeSource[]): ResolvedTracker | undefined {
  for (const { scope, config, configDir } of sources) {
    const value = config.tracker?.value;
    if (typeof value === 'string' && value.trim().length > 0) {
      const doc = config.tracker?.doc;
      return {
        value,
        ...(typeof doc === 'string' && doc.length > 0 ? { doc } : {}),
        scope,
        configDir,
      };
    }
  }
  return undefined;
}

function resolveTicketSkills(sources: ScopeSource[]): ResolvedTicketSkill[] {
  const names = new Set<string>();
  for (const { config } of sources) {
    for (const name of Object.keys(config.ticketSkills ?? {})) names.add(name);
  }

  const resolved: ResolvedTicketSkill[] = [];
  for (const name of names) {
    for (const { scope, config } of sources) {
      const entry = config.ticketSkills?.[name];
      if (entry === undefined) continue;
      // A tombstone (null) in the nearest scope hides the inherited registration.
      if (entry === null) break;
      resolved.push({ name, when: entry.when, scope });
      break;
    }
  }
  return resolved;
}
