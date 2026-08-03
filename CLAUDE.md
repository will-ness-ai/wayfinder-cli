# CLAUDE.md

## Privacy rule (mandatory, applies to every commit)

This is a public repository. Never commit personal details of the repo owner or any contributor:

- No real names or personal email addresses in file contents or commit metadata. Commits use the repo-local git identity (GitHub noreply address), never a personal email.
- No absolute file paths from a contributor's machine (for example `/Users/<name>/...`). Use repo-relative paths in all docs, code, and examples.
- Anonymize all example, test, and research data before committing. Replace personal project names, org names, and identifiers with neutral placeholders (for example `acme`).
- Check every diff against this rule before committing.
