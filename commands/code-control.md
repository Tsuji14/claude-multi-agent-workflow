---
description: Run the full code control workflow (review, fix, test) on the codebase.
---
Run the code control workflow on the codebase:

1. In parallel, start these two independent steps:
   - Run the code-reviewer subagent to analyze the code and identify issues.
   - Use the run-tests skill to run the test suite and record the baseline results before anything changes.

2. After the review completes, run the code-fixer subagent and give it the reviewer's report. This step depends on the reviewer's output.

3. After the fixer completes, use the run-tests skill again to verify the fixes. This step depends on the fixer's changes. Compare the results with the baseline from step 1 and flag any test that passed before but fails now.

Finish with a summary of the issues found, the fixes applied, and the before-and-after test results.
