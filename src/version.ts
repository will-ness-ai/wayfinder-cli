import { readFileSync } from 'node:fs';

/** The package version, read from the shipped `package.json` at the package root. */
export function readVersion(): string {
  const packageJson = readFileSync(new URL('../package.json', import.meta.url), 'utf8');
  const parsed = JSON.parse(packageJson) as { version?: string };
  return parsed.version ?? '0.0.0';
}
