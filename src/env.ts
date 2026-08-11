/**
 * The single test seam. Every command is driven through {@link run} with an
 * argv array and a {@link CliEnv}, and asserts on the returned {@link CliResult}.
 * No command reads `process` directly; the real entry point in `bin.ts` builds
 * a {@link CliEnv} from `process` and hands it in.
 */
export interface CliEnv {
  /** The home directory. User-scope config resolves under here. */
  home: string;
  /** The working directory. Project- and local-scope config resolve from here. */
  cwd: string;
  /** Whether stdout is attached to a TTY. Setup commands use it to pick a form. */
  isTTY: boolean;
  /** The process environment variables. */
  env: Record<string, string | undefined>;
  /**
   * Ask the human one question and read one line back. The real entry point backs
   * this with readline; a test backs it with a scripted answer list, which is how
   * the TTY half of dual mode is driven through the seam. A missing `ask` means no
   * form can run, so a TTY with none behaves like a pipe.
   */
  ask?: Ask;
}

/** One question to the human, one line back, already trimmed. */
export type Ask = (question: string) => Promise<string>;

/** The observable result of a CLI invocation: the bytes written and the exit code. */
export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}
