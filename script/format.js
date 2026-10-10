// PostToolUse hook: after Claude writes or edits a JavaScript file, run the
// project's own ESLint with --fix on that one file.
// Reads the hook payload (JSON) from stdin. Never blocks Claude: problems are
// reported on stderr and the script exits 0.

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const JS_EXTENSIONS = new Set(['.js', '.cjs', '.mjs']);

// Walk up from the edited file to the nearest folder with a package.json,
// so ESLint runs with that project's config and locally installed version.
function findProjectRoot(startDir) {
  let dir = startDir;
  while (true) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function main(rawInput) {
  const payload = JSON.parse(rawInput);
  const filePath = payload.tool_input && payload.tool_input.file_path;
  if (!filePath || !JS_EXTENSIONS.has(path.extname(filePath))) return;

  const projectRoot = findProjectRoot(path.dirname(filePath));
  if (!projectRoot) return;

  const eslintBin = path.join(projectRoot, 'node_modules', 'eslint', 'bin', 'eslint.js');
  if (!fs.existsSync(eslintBin)) return; // project doesn't use ESLint locally

  try {
    execFileSync(process.execPath, [eslintBin, '--fix', filePath], {
      cwd: projectRoot,
      stdio: ['ignore', 'ignore', 'pipe'],
    });
  } catch (err) {
    // ESLint exits 1 when unfixable problems remain; surface them without blocking.
    process.stderr.write(`format.js: ESLint reported problems in ${filePath}\n`);
  }
}

let input = '';
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', () => {
  try {
    main(input);
  } catch (err) {
    process.stderr.write(`format.js: ${err.message}\n`);
  }
});
