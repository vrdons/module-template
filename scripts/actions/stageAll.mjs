import { exec } from '../utils/exec.mjs';

console.log('⚠️ Staging all changes...');
exec('git add .');
console.log('✔️ Staged all changes!');
