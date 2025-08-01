import { exec, getPackageJson } from '../utils/exec.mjs';
import pack from 'libnpmpack';
import { getCurrentCommitSha, owner, repo } from '../utils/octokit.mjs';
import { join } from 'path';
import { homedir, tmpdir } from 'os';
import { writeFileSync } from 'fs';

const githubRegistry = 'https://npm.pkg.github.com';
const npmjsRegistry = 'https://registry.npmjs.org';

async function buildProject() {
   const pkg = getPackageJson();
   console.log('🚀 Starting NPM Publish Process...');
   console.log(`🔗 Repository: ${owner}/${repo} (from git remote)`);
   console.log(`✨ Version: v${pkg.version}`);

   const npmrcPath = join(homedir(), '.npmrc');
   const githubToken = process.env.GITHUB_TOKEN;
   if (!githubToken) {
      throw new Error('❌ GITHUB_TOKEN is not set');
   }
   writeFileSync(npmrcPath, `//npm.pkg.github.com/:_authToken=${githubToken}\n`);
   console.log('🛡️ Wrote temporary .npmrc for GitHub Registry auth');

   const url = `${githubRegistry}/${encodeURIComponent(pkg.name)}`;
   const res = await fetch(url, {
      headers: {
         Authorization: `Bearer ${githubToken}`,
         Accept: 'application/vnd.npm.install-v1+json',
      },
   });

   if (res.status === 404) {
      console.log('📦 Package not found on GitHub registry — first publish!');
   } else if (!res.ok) {
      throw new Error(`❌ Failed to fetch GitHub registry info: ${res.status}`);
   } else {
      const json = await res.json();
      if (json.versions?.[pkg.version]) {
         console.log(`⚠️ Version ${pkg.version} already exists on GitHub registry, skipping publish.`);
         process.exit(0);
      }
   }

   console.log('✅ Proceeding with GitHub Packages release');
   const currentSha = await getCurrentCommitSha();
   console.log(`📍 Current commit: ${currentSha.substring(0, 7)}`);

   console.log('📦 Installing dependencies...');
   exec('npm ci');
   console.log('🔨 Building TypeScript...');
   exec('npm run build', { env: { ...process.env, BUILD_SOURCE: 'NPM' } });
   console.log('📦 Packing npm...');
   const tarballBuffer = await pack(process.cwd());
   const tempPath = join(tmpdir(), `publish.tgz`);
   writeFileSync(tempPath, tarballBuffer);
   console.log('📦 Written tarball to temp path:', tempPath);

   console.log('🚚 Publishing to GitHub Packages Registry...');
   exec(`npm publish "${tempPath}" --registry=${githubRegistry}`);
   console.log('✅ Published to GitHub Packages!');

   console.log('🚚 Publishing to npmjs Registry...');

   const npmToken = process.env.NPM_TOKEN;
   if (!npmToken) {
      throw new Error('❌ NPM_TOKEN is not set for npmjs publish');
   }
   writeFileSync(npmrcPath, `//registry.npmjs.org/:_authToken=${npmToken}\n`, { flag: 'a' });
   console.log('🔎 Checking version on npmjs registry...');
   const npmRes = await fetch(`${npmjsRegistry}/${encodeURIComponent(pkg.name)}`);
   if (npmRes.status === 404) {
      console.log('📦 Package not found on npmjs — first publish!');
   } else if (!npmRes.ok) {
      throw new Error(`❌ Failed to fetch npmjs registry info: ${npmRes.status}`);
   } else {
      const json = await npmRes.json();
      if (json.versions?.[pkg.version]) {
         console.log(`⚠️ Version ${pkg.version} already exists on npmjs registry, skipping publish.`);
         process.exit(0);
      }
   }
   exec('npm publish --access public');
   console.log('✅ Published to npmjs Registry!');
}

void buildProject();
