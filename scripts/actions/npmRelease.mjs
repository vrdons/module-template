import { exec } from '../utils/exec.mjs';
import pack from 'libnpmpack';
import { checkTagExists, createRelease, createVersionTag, getCurrentCommitSha, owner, repo } from '../utils/octokit.mjs';
import { generateUncommittedChangelog } from './generateChangelog.mjs';
import { join } from 'path';

async function buildProject() {
   console.log('🚀 Starting GitHub NPM Publish Process...');
   console.log(`🔗 Repository: ${owner}/${repo} (from git remote)`);
   const tagExists = await checkTagExists(version);

   if (tagExists) {
      console.log('⚠️  Tag already exists, skipping release creation');
      return;
   }
   console.log('✅ Tag does not exist, proceeding with release');
   const currentSha = await getCurrentCommitSha();
   console.log(`📍 Current commit: ${currentSha.substring(0, 7)}`);

   console.log('📦 Installing dependencies...');
   exec('npm ci');
   console.log('🔨 Building TypeScript...');
   exec('npm run build', { env: { ...process.env, BUILD_SOURCE: 'NPM' } });
   console.log('📦 Packing npm...');
   const tarballBuffer = await pack(process.cwd());
   const tempPath = join(tmpdir(), `publish-${randomUUID()}.tgz`);
   await writeFile(tempPath, tarballBuffer);
   console.log('📦 Written tarball to temp path:', tempPath);
   console.log('🚚 Publishing to GitHub Packages Registry...');
   exec(`npm publish "${tempPath}" --registry=https://npm.pkg.github.com/`);

   console.log('✅ Package published to GitHub NPM registry!');
}
buildProject();
