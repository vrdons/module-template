import fs from 'fs';
import path from 'path';
const curreg = /\[VI\]\{\{(.+?)\}\}\[\/VI\]/g;
import { owner, repo } from '../utils/octokit.mjs';
import { getPackageJson } from '../utils/exec.mjs';

const packageJson = getPackageJson();

export default async function () {
   await new Promise(resolve => setTimeout(resolve, 50));

   function getAllJsFiles(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      return entries.flatMap(entry => {
         const fullPath = path.join(dir, entry.name);
         if (entry.isDirectory()) return getAllJsFiles(fullPath);
         if ((entry.isFile() && fullPath.endsWith('.js')) || fullPath.endsWith('.mjs')) return [fullPath];
         return [];
      });
   }

   const jsFiles = getAllJsFiles('dist');
   for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.match(curreg)) {
         const filtered = content.replace(curreg, (match, p1) => {
            if (p1 === 'version') {
               return gerVersion();
            } else if (p1 === 'name') {
               return packageJson.name;
            } else if (p1 == 'ghown') {
               return owner;
            } else if (p1 == 'ghrep') {
               return repo;
            } else {
               return match;
            }
         });
         fs.writeFileSync(file, filtered, 'utf8');
         console.log(`🧹 Patched: ${file}`);
      }
   }
}
function gerVersion() {
   try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const source = process.env.BUILD_SOURCE;
      return `v${packageJson?.version ?? '0.0.1'}`; //${source ? `|${source}` : ''}
   } catch {
      return 'v0.0.1';
   }
}
