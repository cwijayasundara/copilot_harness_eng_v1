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

try {
  const raw = JSON.parse(fs.readFileSync('/dev/stdin', 'utf8'));
  const input = normalizeInput(raw);
  const filePath = input.file_path || (input.tool_input && input.tool_input.file_path);

  if (!filePath) {
    process.exit(0);
  }

  const filename = path.basename(filePath);

  // Match .env, .env.local, .env.production, etc. but NOT .env.example
  if (filename === '.env.example') {
    process.exit(0);
  }

  const envPattern = /^\.env(\..+)?$/;

  if (envPattern.test(filename)) {
    process.stdout.write(
      `BLOCKED: Cannot modify ${filename} — environment files contain real secrets. Edit manually.\nFix: Edit .env.example instead for documentation, or edit .env manually outside Claude.\n`
    );
    process.exit(2);
  }
} catch (_) {
  // Silent exit — stderr output triggers "hook error" in the agent
}

process.exit(0);
