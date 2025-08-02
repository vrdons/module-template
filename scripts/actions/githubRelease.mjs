import { exec, getPackageJson } from '../utils/exec.mjs';
import pack from 'libnpmpack';
import { checkTagExists, createRelease, createVersionTag, getCurrentCommitSha, owner, repo } from '../utils/octokit.mjs';
import { generateUncommittedChangelog } from './generateChangelog.mjs';

async function buildProject() {
   const pkg = getPackageJson();
   console.log('🚀 Starting GitHub Release Process...');
   console.log(`🔗 Repository: ${owner}/${repo} (from git remote)`);
   console.log(`✨ Version: v${pkg.version}`);
   const version = `v${pkg.version}`;
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
   exec('npm run build', { env: { ...process.env, BUILD_SOURCE: 'GH' } });
   console.log('📦 Packing npm...');
   const tarballBuffer = await pack(process.cwd());

   await createVersionTag(version, currentSha);
   console.log(`📝 Generating changelog...`);
   const changelog = await generateUncommittedChangelog();
   const notes = `## Release Notes${changelog ? `\n\n${changelog}` : ''}`;

   const release = await createRelease(version, tarballBuffer, notes);
   console.log('✅ GitHub Release created successfully!');
   console.log(`🔗 Release URL: ${release.html_url}`);
   console.log('📦 Asset uploaded: install.tgz');
}
void buildProject();
