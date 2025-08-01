import { exec } from '../utils/exec.mjs';
import pack from 'libnpmpack';
import { getCurrentCommitSha, owner, repo } from '../utils/octokit.mjs';
import { join } from 'path';
const registry = 'https://npm.pkg.github.com';
async function buildProject() {
   const pkg = getPackageJson();
   console.log('🚀 Starting GitHub NPM Publish Process...');
   console.log(`🔗 Repository: ${owner}/${repo} (from git remote)`);
   console.log(`✨ Version: v${pkg.version}`);
   const version = `${pkg.version}`;
   const url = `${registry}/${encodeURIComponent(pkg.name)}`;

   const res = await fetch(url, {
      headers: {
         Authorization: `Bearer ${process.env.NODE_AUTH_TOKEN}`,
         Accept: 'application/vnd.npm.install-v1+json',
      },
   });

   if (res.status === 404) {
      console.log('📦 Package not found on registry — first publish!');
   } else if (!res.ok) {
      throw new Error(`❌ Failed to fetch registry info: ${res.status}`);
   } else {
      const json = await res.json();
      if (json.versions?.[version]) {
         console.log(`⚠️ Version ${version} already exists on registry, skipping publish.`);
         process.exit(0);
      }
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
   exec(`npm publish "${tempPath}" --registry=${registry}`);

   console.log('✅ Package published to GitHub NPM registry!');
}
void buildProject();
