# TASK

Review the code changes on branch `{{BRANCH}}` and improve code clarity, consistency, and maintainability while preserving exact functionality.

# CONTEXT

## Branch diff

!`git diff {{TARGET_BRANCH}}...{{BRANCH}}`

## Commits on this branch

!`git log {{TARGET_BRANCH}}..{{BRANCH}} --oneline`

# REVIEW PROCESS

1. **Understand the change**: Read the diff and commits above to understand the intent. Find the ticket via the `Closes #<N>` line and read it, along with the spec sections it names (`gh issue view 34`).

2. **Analyze for improvements**: Look for opportunities to:
   - Reduce unnecessary complexity and nesting
   - Eliminate redundant code and abstractions
   - Improve readability through clear variable and function names
   - Consolidate related logic
   - Remove unnecessary comments that describe obvious code
   - Avoid nested ternary operators - prefer switch statements or if/else chains
   - Choose clarity over brevity - explicit code is often better than overly compact code

3. **Check correctness**:
   - Does the implementation match the ticket's acceptance criteria? Are edge cases handled?
   - Are new/changed behaviours covered by tests through the single seam — the CLI entry point with an injected environment? A test that reaches past that seam into an internal function is a defect; move it up.
   - Are there unsafe casts, `any` types, or unchecked assumptions?
   - Does the change introduce injection vulnerabilities, credential leaks, or other security issues?

4. **Check the language**: `CONTEXT.md` at the repo root is the project glossary. Code, comments, and rendered prose use its terms. Flag a synonym the glossary lists under *Avoid*.

5. **Check the privacy rule**: `CLAUDE.md` at the repo root binds every commit in this public repository — no real names, no personal email addresses, and no absolute paths from a contributor's machine.

6. **Maintain balance**: Avoid over-simplification that could:
   - Reduce code clarity or maintainability
   - Create overly clever solutions that are hard to understand
   - Combine too many concerns into single functions or components
   - Remove helpful abstractions that improve code organization
   - Make the code harder to debug or extend

7. **Apply project standards**: Follow the coding standards defined in @.sandcastle/CODING_STANDARDS.md

8. **Preserve functionality**: Never change what the code does - only how it does it. All original features, outputs, and behaviors must remain intact.

# EXECUTION

If you find improvements to make:

1. Make the changes directly on this branch
2. Run `pnpm typecheck`, `pnpm lint`, and `pnpm test` from the repo root to ensure nothing is broken
3. Commit describing the refinements

If the code is already clean and well-structured, make no changes.

Do NOT merge or push — the host merges this branch into {{TARGET_BRANCH}} after you finish. If the implementer's work is fundamentally broken and you cannot fix it on this branch, comment on the issue (find it via the `Closes #<N>` line in `git log`), reopen it with `gh issue reopen <N>`, and reset the branch to {{TARGET_BRANCH}} (`git reset --hard {{TARGET_BRANCH}}`) so nothing broken gets merged.

Once complete, output <promise>COMPLETE</promise>.
