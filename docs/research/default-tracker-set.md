# Default tracker set: which values ship built-in operations docs in v1

Research for the command-surface prototype's deferred item ("The default tracker set"). Survey date: **2026-08-03**, against primary sources only (official docs, official repos, first-party changelogs). Every load-bearing claim cites the source it was verified against; facts that could not be pinned to a primary source are marked **unverified**.

The provisional mock list under test: `github cli`, `github mcp`, `gitlab cli`, `gitlab mcp`, `jira mcp`, `linear mcp`, `local`. The repo already ships `content/trackers/github.md` (gh CLI), `content/trackers/gitlab.md` (glab CLI), and `content/trackers/local.md`.

## Summary

- **Recommended v1 set: `github cli`, `github mcp`, `gitlab cli`, `jira mcp`, `linear mcp`, `local` — the mock list minus `gitlab mcp`.**
- **Drop `gitlab mcp`**: GitLab's official MCP server is Beta and its issue surface is too thin for wayfinding (no list-issues, no update/assign/close tools); the popular community server is unofficial and fast-moving. `gitlab cli` covers GitLab; the freeform-value fallback covers anyone running a community GitLab MCP.
- **No additions for v1.** Azure DevOps (`azure-devops mcp`) is the strongest second-tier candidate — official Microsoft MCP server, native Parent/Child and Predecessor/Successor links — but its remote server is still public preview and its coding-agent prevalence trails the core four. First candidate for v2.
- The shipped `content/trackers/github.md` is **out of date in a good way**: gh CLI v2.94.0 (2026-06-10) added native flags for sub-issues and dependencies, so the doc's `gh api` instructions can be replaced by first-class flags (keeping `gh api` as the fallback for older gh).
- The two hard wayfinding facts that shape every doc: (1) no tracker can express the full frontier query ("open children, unblocked, unassigned") in one server-side query — every doc needs a "narrow server-side, then inspect blockers per issue" recipe; (2) blocking relationships are tier-gated on GitLab (Premium/Ultimate) and workflow-shaped on Jira (close = transition, not a universal verb), so those docs need explicit fallbacks.

## Comparison table

"Hierarchy" = native parent/child issue structure. "Blocking" = native blocked-by/blocks link. "Frontier" = how close a single server-side query gets to "open + unblocked + unassigned children of the map".

| Value | Surface (official?) | Hierarchy | Blocking | Frontier | Doc stability | Verdict |
|---|---|---|---|---|---|---|
| `github cli` | gh CLI, official, versioned | Native sub-issues, gh flags since v2.94.0 | Native dependencies (GA 2025-08-21), gh flags since v2.94.0 | Partial: `-is:blocked no:assignee` search, but no parent qualifier — list children then filter | High | **Ship** |
| `github mcp` | github/github-mcp-server, official, GA | `sub_issue_write`, `issue_read` parent/sub-issues | **No dedicated dependency tools** — fallback needed | Partial: `search_issues` with `-is:blocked no:assignee`; children client-side | Medium-high | **Ship** |
| `gitlab cli` | glab, official, versioned | Tasks free-tier; epics Premium; prose fallback works everywhere | Native, but **Premium/Ultimate only** | Weak: list + per-issue links inspection | High | **Ship** |
| `gitlab mcp` | Official server is **Beta**; community server unofficial | Work-item linking only | `link_work_items` exists | No list/update/assign/close tools | Low (beta, thin, moving) | **Drop** |
| `jira mcp` | Atlassian Remote MCP, official, Cloud-only | Native `parent` field | "Blocks" link type ships by default | Partial: JQL narrows (parent, statusCategory, empty assignee); cannot negate links — inspect per issue | Medium | **Ship** |
| `linear mcp` | Official Linear MCP, GA; no official CLI exists | Native parent/sub-issues, free tier | Native relations incl. blocks, free tier | Partial: assignee/state filters; blocking-negation filter unverified — inspect per issue | Medium-high | **Ship** |
| `local` | In-repo markdown, no external surface | Files under a map dir | `Blocked by:` line | Trivial (scan files) | Total | **Ship** |
| `azure-devops mcp` | microsoft/azure-devops-mcp; local GA, remote preview | Parent/Child link type | Predecessor/Successor link type | WIQL query tool | Medium (remote preview) | Out (v2 candidate) |
| Others (tea, Bitbucket, Shortcut, YouTrack, Plane, Notion, Asana, Monday) | Mixed | Mostly gaps | Mostly gaps | — | — | Out (see below) |

## GitHub

Surfaces coding agents actually use: the `gh` CLI (ubiquitous in terminal agents) and the official remote MCP server, which the Claude Code docs use as their worked GitHub example (`https://api.githubcopilot.com/mcp/`). Source: <https://code.claude.com/docs/en/mcp> (checked 2026-08-03).

### Platform facts (apply to both `github cli` and `github mcp`)

- **Sub-issues are GA.** REST: `GET/POST /repos/{owner}/{repo}/issues/{n}/sub_issues`, `DELETE .../sub_issue`, `PATCH .../sub_issues/priority`, `GET .../parent`. No preview headers. Source: <https://docs.github.com/en/rest/issues/sub-issues> (checked 2026-08-03). GraphQL: `parent`, `subIssues`, `subIssuesSummary` on `Issue`. Source: <https://docs.github.com/en/graphql/reference/issues> (checked 2026-08-03).
- **Issue dependencies (blocked-by/blocks) are GA since 2025-08-21.** REST: `GET/POST /repos/{owner}/{repo}/issues/{n}/dependencies/blocked_by`, `DELETE .../blocked_by/{issue_id}`, `GET .../dependencies/blocking`; issue JSON carries `issue_dependencies_summary`. Sources: <https://github.blog/changelog/2025-08-21-dependencies-on-issues/>, <https://docs.github.com/en/rest/issues/issue-dependencies> (checked 2026-08-03).
- **Search qualifiers**: `is:blocked`, `is:blocking`, `blocked-by:<n>`, `blocking:<n>`, `no:assignee` exist; there is **no parent/child search qualifier**, so scoping a query to a map's children requires listing sub-issues and filtering client-side. Sources: <https://github.blog/changelog/2025-08-21-dependencies-on-issues/>, <https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests> (checked 2026-08-03).

### `github cli`

- **gh v2.94.0 (2026-06-10) added native sub-issue/type/dependency management**: `gh issue create --parent`, `--blocked-by`, `--blocking`, `--type`; `gh issue edit --set-parent` / `--remove-parent` / `--add-sub-issue` / `--add-blocked-by` / `--add-blocking` (and `--remove-*` counterparts); `gh issue view` / `gh issue list` expose parent, sub-issue, type, and dependency data as JSON fields. Verified directly against the changelog and release notes: <https://github.blog/changelog/2026-06-10-manage-sub-issues-types-and-dependencies-from-github-cli/>, <https://github.com/cli/cli/releases/tag/v2.94.0> (checked 2026-08-03). Latest gh at survey time: v2.97.0, 2026-07-31 — <https://github.com/cli/cli/releases> (checked 2026-08-03).
- **Stability: high.** Official, versioned, backed by GA platform features; the underlying REST endpoints are stable fallbacks.
- **Doc must cover**: basic ops (already in `content/trackers/github.md`); map = parented issues via `--parent`; blocking via `--blocked-by`/`--add-blocked-by`; frontier = list children (`gh issue view <map> --json` sub-issue fields, or the `sub_issues` endpoint via `gh api`), then drop issues with open blockers (dependency JSON fields / `issue_dependencies_summary.blocked_by > 0`) or an assignee; claim = `gh issue edit <n> --add-assignee @me`; resolve = comment + close. **Fallbacks to keep**: `gh api` against the sub-issues and dependencies REST endpoints for gh < 2.94.0 (with the note that the dependencies POST takes the blocker's numeric database id), and the prose `Blocked by: #n` line for repos where the feature is unavailable. **Action**: update the shipped doc — it predates v2.94.0 and routes everything through `gh api`.

### `github mcp`

- **Official and GA.** Remote server GA 2025-09-04 at `https://api.githubcopilot.com/mcp/`; OAuth 2.1 + PKCE (PAT header also supported by clients). Sources: <https://github.blog/changelog/2025-09-04-remote-github-mcp-server-is-now-generally-available/>, <https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md> (checked 2026-08-03).
- **Issue tools** (from the repo README, checked 2026-08-03): `issue_read` (details, comments, sub-issues, parent, labels), `issue_write` (create/update — assignees, labels, state), `add_issue_comment`, `list_issues`, `search_issues`, `sub_issue_write` (add/remove/reprioritize), `get_label`/`list_label`/`label_write`. Source: <https://github.com/github/github-mcp-server/blob/main/README.md>.
- **Gap: no dedicated issue-dependency tools.** The README documents no blocked-by/blocking tools (verified directly, checked 2026-08-03). Whether `issue_read` returns `issue_dependencies_summary` is **unverified**. The doc must therefore route blocking through `search_issues` qualifiers (`-is:blocked no:assignee`, `blocked-by:<n>`) for reads and fall back to the prose `Blocked by: #n` line (or `gh api`, when a shell is also available) for writes.
- **Stability: medium-high.** Official and GA, but the toolset has a history of consolidation (tools reorganized into `*_read`/`*_write` forms), so the doc should describe operations by capability with tool names as hints, not hard-code exact call shapes.
- **Doc must cover**: create/read/list/comment/label/close via the tools above; map children via `sub_issue_write`/`issue_read`; the dependency gap and its fallbacks; claim = `issue_write` with assignees; resolve = `add_issue_comment` + `issue_write` state closed.

## GitLab

### Platform facts

- **Blocking links are paid-tier.** The linked-items user docs state blocking ("blocks" / "is blocked by") is **Tier: Premium, Ultimate**; plain "relates to" is Free. Verified directly: <https://docs.gitlab.com/user/project/issues/related_issues/> (checked 2026-08-03). The Issue links API accepts `link_type` of `relates_to` (default), `blocks`, `is_blocked_by` (`POST /projects/:id/issues/:iid/links`), and the API page carries a page-level "Tier: Free, Premium, Ultimate" without a per-parameter gate — treat the feature-level Premium gate as authoritative. Source: <https://docs.gitlab.com/api/issue_links/> (checked 2026-08-03).
- **Hierarchy is split by tier.** Epics: **Tier: Premium, Ultimate** (child epics Ultimate-only); epics became work items (GA in GitLab 18.1). Source: <https://docs.gitlab.com/user/group/epics/> (checked 2026-08-03). Tasks: **Tier: Free, Premium, Ultimate** — a Free-tier issue can have child tasks via the work-items parent field. Source: <https://docs.gitlab.com/user/tasks/> (checked 2026-08-03). A labelled map issue + `Part of #<map>` prose (the shipped doc's approach) works on every tier.
- **Quick actions** `/blocked_by`, `/blocks`, `/assign`, `/close`, `/label` all exist for issues (the reference does not repeat a per-action paid gate, but `/blocked_by`//`/blocks` execute the Premium-gated feature). Source: <https://docs.gitlab.com/user/project/quick_actions/> (checked 2026-08-03).

### `gitlab cli`

- glab is GitLab's official CLI (`gitlab-org/cli`). `glab issue create` has `--link-type` (default `relates_to`) and `--linked-issues` flags; blocking edges can also be posted as quick-action notes. Verified directly against the command doc: <https://gitlab.com/gitlab-org/cli/-/raw/main/docs/source/issue/create.md> (checked 2026-08-03). Latest glab version at survey time: **unverified**.
- **Stability: high.** Official, versioned; the underlying issue-links API is stable; `glab api` is a complete fallback.
- **Doc must cover**: what `content/trackers/gitlab.md` already covers — this survey confirms it is accurate, including the Premium/Ultimate caveat and prose fallback. Optional addition: `--link-type is_blocked_by --linked-issues <n>` at create time as an alternative to the quick-action note; frontier stays "list children, check `glab api projects/:id/issues/:iid/links` for open blockers, skip assigned."

### `gitlab mcp` — drop from v1

- **The official GitLab MCP server is Beta** (changed from experiment to beta in GitLab 18.6), all tiers, GitLab.com/Self-Managed/Dedicated, OAuth 2.0 dynamic client registration. Verified directly: <https://docs.gitlab.com/user/model_context_protocol/mcp_server/> (checked 2026-08-03).
- **Its issue surface cannot carry the wayfinding ops.** Documented tools (checked 2026-08-03): `create_issue`, `get_issue`, `create_workitem_note`, `get_workitem_notes`, `link_work_items`, `search`, `search_labels`, plus MR/pipeline/wiki tools. There is **no list-issues, no issue update, no assign, no close** tool. Source: <https://docs.gitlab.com/user/model_context_protocol/mcp_server_tools/>.
- The de-facto community server (`zereight/gitlab-mcp`) exists and is popular (aggregators report ~1.8k stars — exact count **unverified**), but it is community-maintained, unofficial, and fast-moving. Source: <https://github.com/zereight/gitlab-mcp> (checked 2026-08-03).
- **Judgement**: a shipped static doc would either document a beta official server that cannot claim/close a ticket, or pin to an unofficial project's tool names. Both rot fast. GitLab users get `gitlab cli`; a repo running a community GitLab MCP sets the freeform value (e.g. `gitlab mcp (zereight)`) and the agent improvises against its connected tools — exactly the designed custom fallback. Revisit when the official server's toolset covers update/assign/close.

## Jira — `jira mcp`

- **Official surface**: the Atlassian Remote MCP Server (marketed as the Rovo MCP Server), endpoint `https://mcp.atlassian.com/v1/mcp/authv2`, OAuth 2.1 (API tokens as alternative). Verified directly: <https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/> (checked 2026-08-03). Covers Jira, Jira Service Management, Confluence, and Bitbucket — **Cloud only; Data Center is not supported**. Beta announced 2025-05-01 (<https://www.atlassian.com/blog/announcements/remote-mcp-server>); the support docs now present it as an active service without a beta label — explicit GA labeling **unverified** (checked 2026-08-03).
- **Tool list**: the supported-tools page documents permission groups and capabilities (search via JQL, issue read/write, comments, transitions) rather than a stable verbatim tool-name list. Source: <https://support.atlassian.com/atlassian-rovo-mcp-server/docs/supported-tools/> (checked 2026-08-03). The doc should describe operations by capability, not exact tool names.
- **Hierarchy**: native `parent` field in REST v3 (subtasks and epic-child relationships). Source: <https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/> (checked 2026-08-03).
- **Blocking**: the "Blocks" link type (outward "blocks", inward "is blocked by") ships by default; links are managed via `/rest/api/3/issueLink`. Sources: <https://developer.atlassian.com/cloud/jira/platform/issue-linking-model/>, <https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-link-types/> (checked 2026-08-03).
- **Frontier**: JQL natively expresses `parent = KEY-1 AND statusCategory != Done AND assignee IS EMPTY` and `issue in linkedIssues("KEY-1", "Blocks")`, but **cannot negate link existence** ("has no open blocking issue") without third-party extensions (e.g. ScriptRunner's `issueFunction`). Source: <https://support.atlassian.com/jira-software-cloud/docs/jql-functions/> (checked 2026-08-03). The doc's recipe: JQL narrows to open+unassigned children, then inspect each candidate's links for open blockers.
- **Resolve**: comment (`POST /rest/api/3/issue/{key}/comment`) + transition (`POST /rest/api/3/issue/{key}/transitions`). **Transitions are workflow-specific — there is no universal "close"**; the doc must instruct fetching available transitions and choosing the done-category one. Sources: <https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-comments/>, and the transitions endpoint under <https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/> (checked 2026-08-03).
- **Third-party jira-cli** (`ankitpokhrel/jira-cli`, ~5.7k stars — approximate) is popular but unofficial; not a v1 value. Source: <https://github.com/ankitpokhrel/jira-cli> (checked 2026-08-03).
- **Stability: medium.** Official, but Cloud-only, tool names not published as a stable contract, and close-is-a-transition means the doc must teach a discovery step. Still clearly worth shipping: Jira is the highest-demand enterprise tracker in coding-agent workflows (it is the issue-tracker example in the Claude Code MCP docs — <https://code.claude.com/docs/en/mcp>, checked 2026-08-03).
- **Doc must cover**: capability-described ops; map = parent issue, children via `parent`; blocking via the Blocks link; the JQL narrowing recipe + per-issue link inspection; claim = set assignee; resolve = comment + done-category transition (with transition discovery); Cloud-only caveat, and a note that Data Center repos should use the freeform custom fallback.

## Linear — `linear mcp`

- **Official surface**: Linear MCP server at `https://mcp.linear.app/mcp` (read-write) and `https://mcp.linear.app/mcp/readonly`; OAuth 2.1 with dynamic client registration, or API key / bearer token. Verified directly: <https://linear.app/docs/mcp> (checked 2026-08-03). Announced 2025-05-01: <https://linear.app/changelog/2025-05-01-mcp>. **No official CLI exists** (none listed anywhere in official docs — checked 2026-08-03), so MCP is Linear's only first-party agent surface.
- **Tool list**: the official docs page does **not** publish verbatim tool names — it states the server has "tools available for finding, creating, and updating objects in Linear like issues, projects, and comments" (checked 2026-08-03). Specific names circulating elsewhere (`list_issues`, `create_issue`, `update_issue`, `create_comment`, `create_issue_relation`, ...) come from client introspection and third-party catalogs — **unverified against a primary source**. The doc should describe operations by capability.
- **Hierarchy**: parent and sub-issues are native. Source: <https://linear.app/docs/parent-and-sub-issues> (checked 2026-08-03). GraphQL exposes `parent`/`children` on Issue. Source: <https://linear.app/developers/graphql> (checked 2026-08-03).
- **Blocking**: native issue relations including "blocks"/"blocked by". Source: <https://linear.app/docs/issue-relations> (checked 2026-08-03).
- **Frontier**: the GraphQL filtering API supports `assignee: { null: true }` and state filters; a direct "has no blocking relation" filter is **unverified** on the public filtering docs. Source: <https://linear.app/developers/filtering> (checked 2026-08-03). Recipe: filter open+unassigned children of the parent, then inspect each candidate's relations for open blockers.
- **Tiers**: sub-issues and relations carry no documented plan gate; MCP access is not billed or plan-gated per the official docs (**no explicit pricing-page statement found — treat as unverified-but-likely-free**). Sources: <https://linear.app/docs/issue-relations>, <https://linear.app/docs/mcp>, <https://linear.app/pricing> (checked 2026-08-03).
- **Stability: medium-high.** Official and actively developed; endpoint and auth are stable; the absence of a published tool-name contract is the only rot risk — mitigated by capability-level prose.
- **Doc must cover**: capability-described ops (create/read/list/comment/label/close); map = parent issue with sub-issues; blocking via relations; the filter-then-inspect frontier recipe; claim = set assignee; resolve = comment + move to a Done-type state; GraphQL API (`https://api.linear.app/graphql`, API key) as the scriptable fallback when the agent has a shell but no MCP.

## `local`

Unchanged from the shipped `content/trackers/local.md`: markdown files in-repo, `Blocked by:` lines, `Status:` lines. No external surface, no tiers, no rot. Ship as-is.

## Azure DevOps — strongest excluded candidate

- Official Microsoft MCP server (`microsoft/azure-devops-mcp`): local server GA, **remote server public preview** (as of 2026-08-03). Sources: <https://github.com/microsoft/azure-devops-mcp>, <https://learn.microsoft.com/en-us/azure/devops/mcp-server/remote-mcp-server> (checked 2026-08-03). Work-item tools: `wit_work_item_write` (create/update/add-child), `wit_work_item_link_write`, `wit_query` (WIQL).
- Native link types cover both wayfinding needs: Parent/Child (`System.LinkTypes.Hierarchy`) and Predecessor/Successor (`System.LinkTypes.Dependency`). Source: <https://learn.microsoft.com/en-us/azure/devops/boards/queries/link-type-reference> (checked 2026-08-03). `az boards` CLI exists. Source: <https://learn.microsoft.com/en-us/cli/azure/boards> (checked 2026-08-03).
- **Out for v1** because the remote MCP is preview (rot risk), the tool names were recently consolidated (churn signal), and Azure DevOps trails GitHub/GitLab/Jira/Linear in coding-agent workflow prevalence (absent from the Claude Code MCP docs' worked examples). **First candidate for v2** once the remote server is GA.

## Other candidates — why they are out

- **Gitea/Forgejo (`tea` CLI)**: official CLI exists (<https://gitea.com/gitea/tea>, v0.15.1, 2026-08-02) and Gitea has API-level issue dependencies, but **no native sub-issue hierarchy** (open feature requests: <https://github.com/go-gitea/gitea/issues/13642>) and tea does not expose dependency commands; no official MCP server found (checked 2026-08-03).
- **Bitbucket Cloud**: native issue tracker is **being sunset 2026-08-20** and never had hierarchy or blocking ("we keep the Bitbucket issue tracker very simple"). Sources: <https://community.atlassian.com/forums/Bitbucket-articles/Announcing-sunset-of-Bitbucket-Issues-and-Wikis/ba-p/3193882>, <https://support.atlassian.com/bitbucket-cloud/docs/understand-bitbucket-issues/> (checked 2026-08-03). Bitbucket repos pair with Jira — covered by `jira mcp`.
- **Shortcut**: epic/story/sub-task hierarchy exists (<https://developer.shortcut.com/api/rest/v3>), but blocking-relation API support is **unverified** and the official local MCP repo was archived 2026-07-08 in favor of a hosted endpoint (<https://github.com/useshortcut/mcp-server-shortcut>, checked 2026-08-03). Weak adoption signal.
- **YouTrack**: official JetBrains MCP server (YouTrack 2025.3+) with subtask and depends-on link types (<https://www.jetbrains.com/help/youtrack/cloud/model-context-protocol-server.html>, <https://www.jetbrains.com/help/youtrack/devportal/resource-api-issueLinkTypes.html>, checked 2026-08-03), but the MCP is limited outside self-hosted instances and coding-agent prevalence is low. v2 watchlist.
- **Plane**: official MCP (<https://github.com/makeplane/plane-mcp-server>) and API sub-issues via `parent`, but **blocking relations are not API-exposed** (open requests: <https://github.com/makeplane/plane/issues/5079>, checked 2026-08-03). Blocked on that API.
- **Notion / Asana / Monday**: official MCP servers exist (<https://github.com/makenotion/notion-mcp-server>, <https://developers.asana.com/docs/mcp-server>, <https://github.com/mondaycom/mcp>, checked 2026-08-03), but none is an issue tracker coding agents drive for engineering tickets: Notion has no work-item semantics; Asana has task dependencies but negligible coding-agent-tracker adoption; Monday's sub-item API support is unverified. All are served by the freeform custom fallback.

## Final recommendation

**v1 default tracker set (six values):**

1. **`github cli`** — keep; **update the shipped doc** to gh ≥ 2.94.0 native flags (`--parent`, `--blocked-by`, `--add-sub-issue`, `--add-blocked-by`, dependency/parent JSON fields), demoting `gh api` to the fallback path.
2. **`github mcp`** — add (new doc): official GA server; issue/sub-issue/label/assign/close via `issue_read`/`issue_write`/`sub_issue_write`/`add_issue_comment`/`list_issues`/`search_issues`; blocking via search qualifiers for reads plus prose-line fallback for writes (no dedicated dependency tools).
3. **`gitlab cli`** — keep; shipped doc verified accurate, including the Premium/Ultimate blocking gate and free-tier prose fallback; optionally add `--link-type`/`--linked-issues` at create time.
4. **`jira mcp`** — add (new doc): Atlassian Remote MCP, Cloud-only, OAuth 2.1; capability-described ops; `parent` hierarchy; default Blocks links; JQL-narrow-then-inspect frontier; resolve = comment + done-category transition with transition discovery; Data Center → custom fallback.
5. **`linear mcp`** — add (new doc): official server, OAuth 2.1/API key; capability-described ops (no published tool-name contract); native sub-issues and blocks relations, free tier; filter-then-inspect frontier; GraphQL API as shell fallback.
6. **`local`** — keep as-is.

**Dropped from the mock list**: `gitlab mcp` (official server Beta with no list/update/assign/close issue tools; community server unofficial — both rot a static doc). **Added**: nothing. **v2 watchlist**: `azure-devops mcp` first (on remote-server GA), then YouTrack and Plane (on API/blocking maturity).

## Method and limits

- Survey date 2026-08-03. Four parallel research passes (GitHub; GitLab; Jira+Linear; second-tier candidates) against official docs, repos, and changelogs, with the decision-critical claims re-verified directly: gh v2.94.0 flags, GitHub dependencies GA, github-mcp-server tool list, GitLab blocking tier gate, GitLab task/epic tiers, GitLab official MCP status and tool list, glab link flags, GitLab quick actions, Atlassian MCP endpoint/auth/products, Linear MCP endpoint/auth and docs' tool-list absence.
- Point-in-time: MCP toolsets and CLI flags move fast; the `gitlab mcp` verdict in particular should be re-checked each release cycle.
- Not measured: hard usage data on which trackers coding agents drive most (no public telemetry). The prevalence signal used is presence in first-party agent documentation (Claude Code MCP docs) and each vendor's own positioning; treat it as directional.
- Known unverified items: exact Linear MCP tool names; whether github-mcp-server's `issue_read` returns dependency summaries; Atlassian Remote MCP explicit GA label; latest glab version; zereight/gitlab-mcp exact star count; Linear MCP plan gating (no explicit pricing statement); Monday sub-item API; Shortcut blocking API.
