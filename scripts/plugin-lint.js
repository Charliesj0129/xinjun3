const fs = require('fs');
const path = require('path');
const manifestPaths = fs.readdirSync(path.join(__dirname, '..', 'src', 'plugins'))
  .flatMap(folder => {
    const manifest = path.join(__dirname, '..', 'src', 'plugins', folder, 'manifest.json');
    return fs.existsSync(manifest) ? [manifest] : [];
  });

let exitCode = 0;
for (const manifestPath of manifestPaths) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const rel = path.relative(process.cwd(), manifestPath);
  if (!manifest.safe) {
    console.error(`✗ ${rel}: plugin safe flag must be true`);
    exitCode = 1;
    continue;
  }
  if (manifest.permissions) {
    const valid = manifest.permissions.every((p) => ['calendar', 'health'].includes(p));
    if (!valid) {
      console.error(`✗ ${rel}: unknown permission in manifest`);
      exitCode = 1;
    }
  }
  console.log(`✓ ${manifest.name} manifest OK`);
}

process.exit(exitCode);
