# Attribution

Everything under `content/` is forked from [mattpocock/skills](https://github.com/mattpocock/skills), licensed under the MIT License.

- **Upstream commit at fork time:** [`2ab958093e83e0ec752e6c1c5932da465bf23e0c`](https://github.com/mattpocock/skills/commit/2ab958093e83e0ec752e6c1c5932da465bf23e0c)
- **Fork date:** 2026-08-02

## What was forked

| Here | Upstream path |
|------|---------------|
| `skills/wayfinder/` | `skills/engineering/wayfinder/` |
| `skills/grilling/` | `skills/productivity/grilling/` |
| `skills/domain-modeling/` | `skills/engineering/domain-modeling/` |
| `skills/grill-with-docs/` | `skills/engineering/grill-with-docs/` |
| `skills/research/` | `skills/engineering/research/` |
| `skills/prototype/` | `skills/engineering/prototype/` |
| `skills/to-spec/` | `skills/engineering/to-spec/` |
| `skills/to-tickets/` | `skills/engineering/to-tickets/` |
| `trackers/github-cli.md` | `skills/engineering/setup-matt-pocock-skills/issue-tracker-github.md` |
| `trackers/gitlab.md` | `skills/engineering/setup-matt-pocock-skills/issue-tracker-gitlab.md` |
| `trackers/local.md` | `skills/engineering/setup-matt-pocock-skills/issue-tracker-local.md` |

## Local modifications

- Flattened upstream's category directories (`engineering/`, `productivity/`) — the eight skills sit directly under `skills/`.
- The tracker docs are forked as standalone data under `trackers/` (upstream ships them inside its setup skill). They feed a later tracker-prose-substitution design.
- Removed references to upstream content this repository does not carry: the upstream setup skill (its role here is replaced by CLI configuration), the `/triage` skill, and `triage-labels.md`.
- `trackers/github.md` was renamed to `trackers/github-cli.md` and rewritten for the tracker prose substitution design (issue #24): one file per tracker value, no top-level heading (the render supplies the title), the `gh` 2.94.0 sub-issue and dependency flags promoted over `gh api`, the missing-label rule added, and the "PRs as a triage surface" section removed (it served the upstream `/triage` skill, which this repository does not carry).
- No other content changes. Layout and composition are refined by later decisions on the wayfinder map (issue #1).

## Upstream license

MIT License

Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
