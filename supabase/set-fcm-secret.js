const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT=(.+)/s);
if (!match) {
  console.error('FIREBASE_SERVICE_ACCOUNT not found in .env.local');
  process.exit(1);
}

let value = match[1].trim();
// Strip surrounding quotes that .env wrapping may have added
if (
  (value.startsWith('"') && value.endsWith('"')) ||
  (value.startsWith("'") && value.endsWith("'"))
) {
  value = value.slice(1, -1);
}

console.log('Setting FIREBASE_SERVICE_ACCOUNT secret...');

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['supabase', 'secrets', 'set', `FIREBASE_SERVICE_ACCOUNT=${value}`],
  {
    cwd: __dirname,
    stdio: 'inherit',
    shell: false,
  }
);

if (result.status !== 0) {
  console.error('Failed to set secret. Exit code:', result.status);
  process.exit(1);
}

console.log('Secret set successfully!');
