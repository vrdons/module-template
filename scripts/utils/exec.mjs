import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function exec(command, options = {}) {
   return execSync(command, { ...options, stdio: 'inherit', encoding: 'utf-8' });
}
export function getPackageJson() {
   const packageJsonPath = resolve(process.cwd(), 'package.json');
   if (!existsSync(packageJsonPath)) {
      throw new Error('❌ package.json not found');
   }
   return JSON.parse(readFileSync(packageJsonPath, 'utf8'));
}
export function getRepoUrl() {
   try {
      const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
      console.log(`✨ Remote URL: ${remoteUrl}`);
      return remoteUrl.replace(/\.git$/, '').replace(/^git@github\.com:/, 'https://github.com/');
   } catch {
      const pkgJson = getPackageJson();
      const remoteUrl = pkgJson?.repository?.url
         .replace(/^git\+/, '')
         .replace(/\.git$/, '') ?? '';
      console.log(`✨ Remote URL: ${remoteUrl}`);
      return remoteUrl.replace(/^git@github\.com:/, 'https://github.com/');
   }
}

export function getRepoInfo() {
   const repoURL = getRepoUrl();
   const gitMatch = repoURL.match(/github\.com[/:]([^/]+)\/([^/]+)(?:\.git)?$/),
      owner = gitMatch[1],
      repo = gitMatch[2].replace('.git', '');
   return { owner, repo };
}
