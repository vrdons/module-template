import { exec } from '../utils/exec.mjs';

console.log('✨ Checking lint');

exec('npm run lint');

console.log('✨ Generating changelog');

exec('node scripts/actions/generateChangelog.mjs');

console.log('✨ Building application');

exec('npm run build');

exec('node scripts/actions/stageAll.mjs');
