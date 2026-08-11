import { readFileSync } from 'node:fs';
import { isRecord } from './config.js';

/** The package version, read from the shipped `package.json` at the package root. */
export function readVersion(): string {
  const packageJson = readFileSync(new URL('../package.json', import.meta.url), 'utf8');
  const parsed: unknown = JSON.parse(packageJson);
  if (isRecord(parsed) && typeof parsed.version === 'string') return parsed.version;
  return '0.0.0';
}
