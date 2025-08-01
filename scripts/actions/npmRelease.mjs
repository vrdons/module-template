import { exec, getPackageJson } from '../utils/exec.mjs';
import pack from 'libnpmpack';
import { getCurrentCommitSha, owner, repo } from '../utils/octokit.mjs';
import { join } from 'path';
import { homedir, tmpdir } from 'os';
import { writeFileSync } from 'fs';

const GITHUB_REGISTRY = 'https://npm.pkg.github.com';
const NPMJS_REGISTRY = 'https://registry.npmjs.org';

async function checkVersionExists(registryUrl, packageName, version, headers = {}) {
   const url = `${registryUrl}/${encodeURIComponent(packageName)}`;
   const response = await fetch(url, { headers });

   if (response.status === 404) {
      console.log('📦 Package not found on registry — first publish!');
      return false;
   }

   if (!response.ok) {
      throw new Error(`Failed to fetch registry info: ${response.status}`);
   }

   const data = await response.json();
   const versionExists = data.versions?.[version];

   if (versionExists) {
      console.log(`⚠️ Version ${version} already exists, skipping publish.`);
   }

   return versionExists;
}

async function buildProject() {
   console.log('📦 Installing dependencies...');
   exec('npm ci');

   console.log('🔨 Building TypeScript...');
   exec('npm run build', { env: { ...process.env, BUILD_SOURCE: 'NPM' } });

   console.log('📦 Packing npm...');
   const tarballBuffer = await pack(process.cwd());
   const tempPath = join(tmpdir(), 'publish.tgz');
   writeFileSync(tempPath, tarballBuffer);
   console.log(`📦 Written tarball to temp path: ${tempPath}`);

   return tempPath;
}

async function publishGitHubPackages(pkg, npmrcPath, githubToken) {
   console.log('🚀 Starting GitHub Packages publish...');

   writeFileSync(npmrcPath, `//npm.pkg.github.com/:_authToken=${githubToken}\n`);
   console.log('🛡️ Wrote temporary .npmrc for GitHub Registry auth');

   const versionExists = await checkVersionExists(GITHUB_REGISTRY, pkg.name, pkg.version, {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.npm.install-v1+json',
   });

   if (versionExists) return;

   const currentSha = await getCurrentCommitSha();
   console.log(`📍 Current commit: ${currentSha.substring(0, 7)}`);

   const tarballPath = await buildProject();

   console.log('🚚 Publishing to GitHub Packages Registry...');
   exec(`npm publish "${tarballPath}" --registry=${GITHUB_REGISTRY}`);
   console.log('✅ Published to GitHub Packages!');
}

async function publishNpmjs(pkg, npmrcPath, npmToken, branch) {
   console.log('🚚 Publishing to npmjs Registry...');

   writeFileSync(npmrcPath, `//registry.npmjs.org/:_authToken=${npmToken}\n`, { flag: 'a' });

   console.log('🔎 Checking version on npmjs registry...');
   const versionExists = await checkVersionExists(NPMJS_REGISTRY, pkg.name, pkg.version);

   if (versionExists) return;

   exec(`npm publish --access public --tag ${branch}`);
   console.log('✅ Published to npmjs Registry!');
}

async function main() {
   const pkg = getPackageJson();
   const branch = pkg.version.includes('alpha') || pkg.version.includes('beta') ? 'next' : 'latest';
   const npmrcPath = join(homedir(), '.npmrc');

   console.log('🚀 Starting NPM Publish Process...');
   console.log(`🔗 Repository: ${owner}/${repo} (from git remote)`);
   console.log(`✨ Version: v${pkg.version}`);

   const errors = [];
   const githubToken = process.env.GITHUB_TOKEN;
   const npmToken = process.env.NPM_TOKEN;

   if (githubToken) {
      try {
         await publishGitHubPackages(pkg, npmrcPath, githubToken, branch);
      } catch (error) {
         console.error('❌ GitHub Packages publish failed:', error);
         errors.push('GitHub Packages');
      }
   } else {
      console.error('❌ GITHUB_TOKEN is not set');
      errors.push('GitHub Packages');
   }

   if (npmToken) {
      try {
         await publishNpmjs(pkg, npmrcPath, npmToken, branch);
      } catch (error) {
         console.error('❌ npmjs publish failed:', error);
         errors.push('npmjs');
      }
   } else {
      console.error('❌ NPM_TOKEN is not set');
      errors.push('npmjs');
   }

   if (errors.length > 0) {
      console.error(`❌ Publish failed for: ${errors.join(', ')}`);
      process.exit(1);
   }

   console.log('✅ All publishes succeeded!');
}

await main();
