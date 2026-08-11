---
title: Config
nav: Config
group: Reference
order: 3
description: >-
  The three wayfinder config scopes, the precedence rule, the two keys, and how
  each one resolves — the tracker wholesale, ticket skills as a union.

terminal:
  label: precedence
  lines:
    - kind: cmd
      text: wayfinder tracker set "linear mcp" --user
    - kind: ok
      text: Set tracker to "linear mcp" in user config (~/.config/wayfinder/config.json).
    - kind: out
      text: ""
    - kind: cmd
      text: wayfinder tracker show
    - kind: out
      text: "tracker:"
    - kind: out
      text: "  value: github cli"
    - kind: out
      text: "  scope: project"
    - kind: cm
      text: "# project scope is nearer, so it wins whole"
    - kind: out
      text: ""
    - kind: cmd
      text: wayfinder ticket-skill list
    - kind: out
      text: "ticketSkills[2]{name,when,scope}:"
    - kind: out
      text: "  grill-design,the ticket decides how a UI looks,local"
    - kind: out
      text: "  pre-mortem,a decision is risky and hard to reverse,project"
    - kind: cm
      text: "# ticket skills union across scopes, one row per name"
---

Config lives in JSON files at three scopes. Two keys, and no more.

## The three scopes

| Scope | File | In git |
|---|---|---|
| user | `~/.config/wayfinder/config.json` | no |
| project | `.wayfinder/config.json` | yes |
| local | `.wayfinder/local.json` | no, ignored |

**Local wins over project, and project wins over user.** Project scope is the
one that ships: commit it, and every contributor and every agent on the repo
renders the same skills, the same tracker, and the same registrations. User
scope carries your defaults into a new repo. Local scope is your override on
this machine, and it reaches nobody else.

User scope follows `$XDG_CONFIG_HOME` when that variable is set, and falls back
to `~/.config` when it is not.

The CLI keeps local scope out of git itself. The first write to
`.wayfinder/local.json` plants a `.gitignore` beside it holding `local.json`, and
leaves an existing rule alone. Your repo's root `.gitignore` is never touched.

## The two keys

```json
{
  "tracker": {
    "value": "github cli",
    "doc": "./docs/trackers/acme.md"
  },
  "ticketSkills": {
    "pre-mortem": { "when": "a decision is risky and hard to reverse" },
    "grill-design": null
  }
}
```

### tracker resolves wholesale

The nearest scope that names a `value` supplies both the `value` and the `doc`.
The two never come from different scopes.

Wholesale resolution is the point. Two independent keys could pair a project
value with a user doc, and render Jira operations prose in a GitHub repo. A
tracker value and the prose that explains how to drive it are one decision, so
they resolve as one.

`wayfinder tracker show` reports the winning value, its scope, and its doc.

### ticketSkills resolves as a union

Every name registered at any scope is in the effective set. One name then
resolves wholesale by the same nearest-scope rule, so a project registration
overrides a user registration of the same name, and takes its `when` sentence
with it.

A `null` entry is a **tombstone**: it hides a registration inherited from a
broader scope, in that scope alone. `wayfinder ticket-skill remove` writes one
when the name is not registered in the scope you are removing from.

`wayfinder ticket-skill list` reports the effective set, one row per name, with
the scope that supplied it.

## Doc paths resolve from their own config file

`tracker.doc` is stored as the path you gave, never as a copy of the file. It
resolves against the directory of the config file that holds it, so
`./docs/trackers/acme.md` in `.wayfinder/config.json` means
`docs/trackers/acme.md` in the repo — and it means that for everyone who clones
it.

A path that does not resolve degrades to the no-doc block at render time, in
silence and by design. `wayfinder doctor` is the surface that reports it.

## Reading is tolerant; writing is strict

A config file is hand-edited, so the CLI treats its contents as input rather
than as a promise.

**Reading** never crashes a command. A file that is missing, or is not JSON, or
holds a key of the wrong type, resolves to the empty config, and a bad key
degrades to absent.

**Writing** refuses a file it cannot parse. `tracker set`, `ticket-skill add`,
and their siblings stop with a usage error naming the file rather than clobber a
`ticketSkills` block or a doc path they could not read. Every key the CLI does
not own is preserved through a write.
