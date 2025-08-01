import { readFileSync, writeFileSync } from 'fs';
import lint from '@commitlint/lint';
import loadConfig from '@commitlint/load';
import { commitLintConfig, typeKeys, typeMap } from '../utils/commitOptions.mjs';
const messagePath = process.argv[2];

if (!messagePath) throw new Error(`❌ Required Argument: MessagePath`);
console.log(`⚠️  Commit message path: ${messagePath}`);
const file = readFileSync(messagePath, 'utf-8');
console.log('✨ Checking commit format...');
void checkMessage(file).then(() => {
   console.log('✨ Formatting commit...');

   const types = typeKeys.join('|');
   const regex = new RegExp(`^(${types})(\\(.+\\))?:\\s`);
   const lines = file.split(/\r?\n/);

   const updatedLines = lines.map(line => {
      const typeMatch = line.match(regex);
      if (typeMatch) {
         const type = typeMatch[1];
         const emoji = typeMap[type]?.emoji || '';
         if (emoji && !line.startsWith(emoji)) {
            return emoji + ' ' + line;
         }
      }
      return line;
   });
   const lastMsg = updatedLines.join('\n');
   writeFileSync(messagePath, lastMsg);
   console.log(`✔️  Successfully formatted commit message`);
});

async function checkMessage(msg) {
   const loadedConfig = await loadConfig(commitLintConfig);
   const report = await lint(msg, loadedConfig.rules);
   if (report.errors.length) {
      console.log(report.errors);
      throw new Error('❌ Commit style is invalid');
   }
   console.log(`✔️  Commit message is valid`);
}
