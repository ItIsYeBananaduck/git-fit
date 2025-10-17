const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const specsDir = path.join(repoRoot, 'specs');
const outDir = path.join(repoRoot, '.github', 'spec-kit');
const tocPath = path.join(outDir, 'TOC.md');

if (!fs.existsSync(specsDir)) {
  console.error('No specs directory found at', specsDir);
  process.exit(1);
}
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function listFeatureDirs(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort((a,b) => a.localeCompare(b, undefined, {numeric:true}));
}

function findDisplayFile(featureDir) {
  const candidates = ['spec.md','plan.md','README.md','spec.txt'];
  for (const c of candidates) {
    const p = path.join(specsDir, featureDir, c);
    if (fs.existsSync(p)) return p;
  }
  // fallback: first file under dir
  const files = fs.readdirSync(path.join(specsDir, featureDir));
  const first = files.find(f => fs.statSync(path.join(specsDir, featureDir, f)).isFile());
  return first ? path.join(specsDir, featureDir, first) : null;
}

const features = listFeatureDirs(specsDir);
let toc = '# Spec Kit - Table of Contents\n\n';
toc += `Generated: ${new Date().toISOString()}\n\n`;
if (features.length === 0) {
  toc += 'No specs found.\n';
} else {
  for (const f of features) {
    const display = findDisplayFile(f);
    const displayRel = display ? path.relative(repoRoot, display).replace(/\\/g, '/') : '';
    toc += `- **${f}**`;
    if (displayRel) toc += ` — [spec](${ '/' + displayRel })`;
    toc += '\n';
  }
}

fs.writeFileSync(tocPath, toc, { encoding: 'utf8' });
console.log('Wrote', tocPath);
