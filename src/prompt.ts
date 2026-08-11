import { createInterface, type Interface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import type { Ask } from './env.js';

/**
 * The readline-backed {@link Ask}, and the whole of this module: asking a human
 * a question is the one thing the forms cannot do without the real terminal.
 * What to ask, in what order, and what to do with the answers all live in
 * `forms.ts`, below the seam.
 *
 * The interface opens lazily, so a run that never reaches a form never touches
 * stdin. An EOF answers the empty string, which is what each form's give-up
 * counter reads.
 */
export function readlineAsk(): { question: Ask; close: () => void } {
  let rl: Interface | undefined;

  return {
    question: async (prompt: string): Promise<string> => {
      rl ??= createInterface({ input: stdin, output: stdout });
      try {
        return await rl.question(prompt);
      } catch {
        return '';
      }
    },
    close: () => rl?.close(),
  };
}
