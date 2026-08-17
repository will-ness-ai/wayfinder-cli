import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // `site/` is a standalone project with its own toolchain — it is not part
    // of the published package, and `astro check` lints it there.
    // `.claude/worktrees/` holds whole checkouts of this repo on a developer's
    // machine. Linting them reports every finding a second time, and `pnpm lint`
    // is now a release gate a human runs before opening a pull request.
    ignores: [
      'dist/**',
      'node_modules/**',
      'test/**/__snapshots__/**',
      'site/**',
      '.claude/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
