#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const [,, target, themeArg] = process.argv;
const srcDir = path.resolve(__dirname, '../src');
const targetDir = path.resolve(target);
const themeName = themeArg || path.basename(targetDir);

if (!target) {
  console.error('Usage: node sync-components.js /path/to/target [themeName]');
  process.exit(1);
}

if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}
fs.mkdirSync(targetDir, { recursive: true });

function copyAndReplace(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyAndReplace(srcPath, destPath);
    } else {
      let content = fs.readFileSync(srcPath, 'utf8');
      content = content.replace(/{{sequoia}}/g, themeName);
      fs.writeFileSync(destPath, content, 'utf8');
    }
  }
}

copyAndReplace(srcDir, targetDir);
console.log(`Copied and replaced to ${targetDir}`);
