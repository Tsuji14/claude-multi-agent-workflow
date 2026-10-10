# code-quality

A Claude Code plugin that reviews, fixes, and tests a codebase with one command. A read-only reviewer finds issues, an editing subagent fixes them, and the test suite runs before and after the fix so regressions show up.

This repository is both the plugin and the marketplace that offers it.

## Install

```
/plugin marketplace add Tsuji14/claude-multi-agent-workflow
/plugin install code-quality@fumi-plugins
```

## What's included

| Component | Name | What it does |
|---|---|---|
| Command | `/code-quality:code-control` | Runs the full review → fix → test workflow |
| Subagent | `code-reviewer` | Reviews code for bugs, security issues, style, and mismatches with the docs. Read-only (`Read, Grep, Glob`) |
| Subagent | `code-fixer` | Applies the reviewer's findings with minimal edits (`Read, Grep, Glob, Edit, Write`, no shell) |
| Skill | `code-quality:run-tests` | Detects and runs the project's test suite, and summarizes the results |
| Skill | `code-quality:code-review` | Code review without running the whole workflow |
| Skill | `code-quality:apply-fixes` | Applies review findings without running the whole workflow |
| Hook | `PostToolUse` on `Write\|Edit` | Runs the project's own ESLint with `--fix` on each JavaScript file Claude edits |

## Usage

Commit or stash your work first. The fixer edits your working tree, and a clean tree means `git diff` shows exactly what it changed.

```
/code-quality:code-control
```

The workflow runs in three steps:

1. **In parallel:** `code-reviewer` analyzes the code, and the test suite runs to record a baseline.
2. **After the review:** `code-fixer` applies the reviewer's findings.
3. **After the fixer:** the tests run again and are compared with the baseline. Any test that passed before but fails now is flagged.

It finishes with a summary of the issues found, the fixes applied, and the before-and-after test results.

## Requirements

- Claude Code with plugin support.
- Node.js, for the format hook (`script/format.js`).
- The hook only lints `.js`, `.cjs` and `.mjs` files, in projects with ESLint installed locally (`node_modules/eslint`). Otherwise it does nothing. It never blocks Claude.

## Repository layout

```
.claude-plugin/
  plugin.json          plugin manifest
  marketplace.json     marketplace catalog (lists this plugin, source "./")
agents/                code-reviewer.md, code-fixer.md
commands/              code-control.md
skills/                code-review/, apply-fixes/, run-tests/
hooks/hooks.json       PostToolUse format hook
script/format.js       script the hook runs, via ${CLAUDE_PLUGIN_ROOT}
course-api/            sample Express API the plugin was built and tested against
NOTES.md               design notes: scoping and orchestration decisions
```

## Development

Load the plugin from a local checkout:

```
claude --plugin-dir .
```

Use `/reload-plugins` after editing plugin files. Restart the session if a hook change doesn't take effect.

Validate the structure:

```
claude plugin validate .
node .github/scripts/validate-plugin.js
```

Try it against the sample API:

```
cd course-api
npm install
npm test
```

See [NOTES.md](NOTES.md) for why the subagents are scoped the way they are, and why the workflow runs some steps in parallel and others in order.
