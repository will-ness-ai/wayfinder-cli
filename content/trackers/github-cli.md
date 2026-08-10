Issues live in this repo's GitHub Issues. Use the [`gh`](https://cli.github.com/) CLI for every operation. Run it inside a clone and it infers the repo from `git remote -v`.

The sub-issue and dependency flags below need `gh` 2.94.0 or later. Check with `gh --version`. For an older `gh`, see [Older gh](#older-gh).

## Conventions

- **Create**: `gh issue create --title "..." --body-file <path>`. Write a multi-line body to a file first.
- **Read**: `gh issue view <n> --comments`. Add `--json <fields>` for machine-readable output.
- **List**: `gh issue list --state open --json number,title,labels,assignees`. Filter with `--label`, `--state`, `--assignee`.
- **Comment**: `gh issue comment <n> --body-file <path>`
- **Label**: `gh issue edit <n> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <n> --comment "..."`

## Labels

`gh` refuses a label that this repo does not have. When a skill tells you to apply a label that is missing, ask the human to choose: create it with `gh label create <name>`, or publish without it. Apply the choice they make.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <n> --comments`.

GitHub gives issues and pull requests one number space, so a bare `#42` can be either. Resolve it with `gh issue view 42`, and fall back to `gh pr view 42`.

## Wayfinding operations

The **map** is one issue. Each **ticket** is a sub-issue of the map.

- **Map**: `gh issue create --label wayfinder:map --title "..." --body-file <path>`
- **Child ticket**: `gh issue create --parent <map> --label wayfinder:<type> --title "..." --body-file <path>`, where `<type>` is `research`, `prototype`, `grilling`, or `task`. To adopt an issue that already exists, run `gh issue edit <map> --add-sub-issue <n>`.
- **Blocking**: `gh issue edit <ticket> --add-blocked-by <blocker>`, and `--remove-blocked-by` to undo. To create a ticket that carries its edge, run `gh issue create --blocked-by <blocker> ...`.
- **Frontier**: two steps, because no search qualifier scopes a query to one map's children.
  1. List the children: `gh issue view <map> --json subIssues`.
  2. For each child with `state: OPEN`, run `gh issue view <n> --json blockedBy,assignees`. The ticket is on the frontier when `assignees` is empty and every `blockedBy` node has `state: CLOSED`. First in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me` — the session's first write.
- **Resolve**: `gh issue comment <n> --body-file <path>`, then `gh issue close <n>`, then append the context pointer to the map's Decisions-so-far.

## Older gh

`gh` below 2.94.0 has no sub-issue or dependency flags. Reach the same GitHub features through the REST API:

- **Child ticket**: `gh api --method POST repos/{owner}/{repo}/issues/<map>/sub_issues -F sub_issue_id=<child-db-id>`
- **Blocking**: `gh api --method POST repos/{owner}/{repo}/issues/<ticket>/dependencies/blocked_by -F issue_id=<blocker-db-id>`
- Both endpoints take the **database id**, not the `#number`. Get it with `gh api repos/{owner}/{repo}/issues/<n> --jq .id`.
- **Frontier**: read `issue_dependencies_summary.blocked_by` from `gh api repos/{owner}/{repo}/issues/<n>`. A value above zero means the ticket has an open blocker.

Where the repo has neither the flags nor the endpoints, write `Part of #<map>` and `Blocked by: #<n>` at the top of the ticket body.
