#!/usr/bin/env node
'use strict';

// Adapter: normalize Copilot cloud agent hook input to match expected shape
function normalizeInput(raw) {
  return {
    tool_name: raw.toolName || raw.tool_name,
    tool_input: raw.toolInput || raw.tool_input || {},
    file_path: (raw.toolInput && (raw.toolInput.file_path || raw.toolInput.filePath)) ||
               (raw.tool_input && (raw.tool_input.file_path || raw.tool_input.filePath)) || ''
  };
}

const fs = require('fs');
const path = require('path');

// Walk up from this script's location to find the directory that contains .github/
function findProjectDir(startDir) {
  let current = startDir;
  while (true) {
    const claudeDir = path.join(current, '.github', 'agents');
    if (fs.existsSync(claudeDir)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      // Reached filesystem root without finding .github/agents
      return null;
    }
    current = parent;
  }
}

try {
  const raw = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
  const input = normalizeInput(raw);
  const filePath = input.file_path || (input.tool_input && input.tool_input.file_path);

  if (!filePath) {
    process.exit(0);
  }

  // Resolve the absolute path of the file being written
  const resolvedFilePath = path.resolve(filePath);

  // Allow writes to /tmp
  if (resolvedFilePath.startsWith('/tmp')) {
    process.exit(0);
  }

  const scriptDir = path.dirname(path.resolve(__filename));
  const projectDir = findProjectDir(scriptDir);

  if (!projectDir) {
    process.stdout.write('BLOCKED: Could not determine project directory (no .github/ found in ancestors)\n');
    process.exit(2);
  }

  const resolvedProject = path.resolve(projectDir);

  // Ensure the file path is within the project directory
  if (!resolvedFilePath.startsWith(resolvedProject + path.sep) && resolvedFilePath !== resolvedProject) {
    process.stdout.write(`BLOCKED: Write outside project directory: ${resolvedFilePath}\nFix: Move the file to a location within the project directory or use .github/ for scaffold files.\n`);
    process.exit(2);
  }
} catch (_) {
  // Silent exit — stderr output triggers "hook error" in the agent
}

process.exit(0);
