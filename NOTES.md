# NOTES — `code-quality` plugin

## What the plugin does

`code-quality` reviews, fixes and tests a codebase in one command. It bundles:

| Component | Name | Purpose |
|---|---|---|
| Command | `/code-quality:code-control` | Runs the review → fix → test workflow |
| Subagent | `code-reviewer` | Read-only review: bugs, security, style, and places where code contradicts its docs |
| Subagent | `code-fixer` | Applies the reviewer's findings with minimal edits |
| Skill | `run-tests` | Detects and runs the project's test suite, and summarizes the results |
| Skills | `code-review`, `apply-fixes` | Manual counterparts of the two subagents, for use without the full workflow |
| Hook | `PostToolUse` on `Write\|Edit` | Runs the project's own ESLint with `--fix` on each JavaScript file Claude edits (`script/format.js`) |

It was built and tested against the Express API in `course-api/`.

## Install

From the marketplace (this repo is both the plugin and its marketplace):

```
/plugin marketplace add Tsuji14/claude-multi-agent-workflow
/plugin install code-quality@fumi-plugins
```

For local development, from the repo root:

```
claude --plugin-dir .
```

Then run `/code-quality:code-control`. Use `/reload-plugins` after editing plugin files. Restart the session if a hook change doesn't take effect.

The format hook needs Node.js. It only runs ESLint when the edited file's project has ESLint installed locally (`node_modules/eslint`). Otherwise it does nothing.

## Scoping decision: what each subagent can do

**`code-reviewer` gets only `Read, Grep, Glob`.** A reviewer's job is to report, not change, so it gets no `Edit`, `Write` or `Bash`. This makes "review without making changes" a guarantee instead of a request in the prompt. A reviewer that can edit tends to "just fix" things, and its findings then never reach the fixer or the user. A read-only reviewer is also safe to run alongside other steps, because it can't conflict with anything else writing files.

**`code-fixer` gets `Read, Grep, Glob, Edit, Write`, but not `Bash`.** It needs to change files, but not to run commands. Testing is a separate step in the workflow, so the fixer has no reason to run a shell. Leaving out `Bash` stops it from installing packages, running git commands, or running scripts that delete files.

**Both use `model: sonnet`.** Review and targeted fixes on a small codebase need solid reasoning about code, not the deepest model. Sonnet is a good balance of quality and cost for a workflow that runs often. A larger model would be worth it for big or security-critical codebases.

## Orchestration decision: what runs in parallel and what runs in order

```
step 1 (parallel):  code-reviewer  ──┐      run-tests (baseline)
                                     ▼
step 2 (in order):            code-fixer
                                     ▼
step 3 (in order):     run-tests (verify, compared with baseline)
```

- **Review and the baseline test run run in parallel.** Neither needs the other's output, and neither changes files. That means they can't conflict, and running them together saves time. The baseline matters: without it, a test that was already failing looks like a failure the fixer caused.
- **The fixer waits for the review.** It acts on the reviewer's report, so it can't start until that report exists.
- **Verification waits for the fixer.** Tests run before or during the fix would check old or half-edited code and give a meaningless result. An earlier draft of the command ran the tests in parallel with the fixer. I moved it after the fixer for this reason.

## Known limitations

- The hook lints only `.js`, `.cjs` and `.mjs` files, and only in projects with a local ESLint install.
- The workflow lets the fixer edit your working tree. Commit or stash your work first so its changes show up clearly in `git diff`.
