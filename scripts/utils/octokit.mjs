import { Octokit } from '@octokit/rest';
import { getRepoInfo } from './exec.mjs';

const octokit = new Octokit({
   auth: process.env.GITHUB_TOKEN,
});
const info = getRepoInfo();
export const { owner, repo } = info;
export const repoURL = `https://github.com/${owner}/${repo}`;

/**
 * GitHub API üzerinden repo etiketlerini (tags) alır.
 * Yeniden eskiye sıralı (default: API sırası, genellikle son oluşturulan önce gelir)
 */
export async function getGitTags(owner, repo) {
   try {
      const tags = [];
      let page = 1;
      const per_page = 100;

      while (true) {
         // eslint-disable-next-line no-await-in-loop
         const res = await octokit.rest.repos.listTags({
            owner,
            repo,
            per_page,
            page,
         });

         if (res.data.length === 0) break;

         tags.push(...res.data.map(tag => tag.name));

         if (res.data.length < per_page) break;
         page++;
      }

      return tags;
   } catch (err) {
      console.warn("⚠️  GitHub API'den tag alınamadı:", err.message);
      return [];
   }
}
export function getCommitHash(fullHash) {
   return fullHash.substring(0, 7);
}
/**
 * GitHub API ile iki commit (veya tag) arasında commit listesini alır
 * @param {string} owner - Repo sahibi
 * @param {string} repo - Repo adı
 * @param {string} from - Base commit/tag/SHA
 * @param {string} to - Head commit/tag/SHA (varsayılan: default branch HEAD)
 * @returns {Promise<Array>} - Commit listesi
 */
export async function getCommitsBetween(owner, repo, from, to = 'HEAD') {
   try {
      if (!from) {
         // İlk commit'i almak için sayfalamayı paginate ile yap
         const commits = await octokit.paginate(octokit.rest.repos.listCommits, {
            owner,
            repo,
            per_page: 100,
         });

         from = commits.length > 0 ? commits[commits.length - 1].sha : null;
         if (!from) {
            console.warn('❌ Cannot find lastest branch.');
            return [];
         }
      }
      const res = await octokit.rest.repos.compareCommits({
         owner,
         repo,
         base: from,
         head: to,
      });

      const commits = res.data.commits.map(commit => {
         return {
            hash: commit.sha,
            subject: commit.commit.message.split('\n')[0],
            body: commit.commit.message.split('\n').join('\n').trim(),
            date: commit.commit.author?.date?.slice(0, 10), // YYYY-MM-DD
            authorName: commit.commit.author?.name,
            authorEmail: commit.commit.author?.email,
         };
      });
      return commits;
   } catch (err) {
      console.warn('❌ getCommitsBetween error:', err.message);
      return [];
   }
}

export async function checkTagExists(tagName) {
   console.log(`⚠️ Checking ${tagName} tag exists`);
   try {
      await octokit.rest.git.getRef({
         owner,
         repo,
         ref: `tags/${tagName}`,
      });
      console.log(`✔️ ${tagName} tag exists`);
      return true;
   } catch (error) {
      console.warn(`❌ ${tagName} tag not found`);

      if (error.status === 404) {
         return false;
      }
      throw error;
   }
}
export async function getCurrentCommitSha() {
   console.log(`⚠️ Checking current sha`);
   const { data: branch } = await octokit.rest.repos.getBranch({
      owner,
      repo,
      branch: 'master',
   });
   console.log(`✔️ Found sha: ${branch.commit.sha}`);
   return branch.commit.sha;
}
export async function createVersionTag(version, sha) {
   console.log(`🏷️  Creating version tag: ${version}`);
   await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/tags/${version}`,
      sha: sha,
   });
   console.log(`✔️ Successfully created tag: ${version}`);
}
export async function createRelease(version, tgzBuffer, body = '') {
   console.log('🎉 Creating GitHub Release...');

   const { data: release } = await octokit.rest.repos.createRelease({
      owner,
      repo,
      tag_name: version,
      name: version,
      body: body || `Release ${version}`,
      draft: false,
      prerelease: version.includes('alpha') || version.includes('beta') || version.includes('rc'),
   });

   // Upload the .tgz file as a release asset
   console.log('📎 Uploading release asset...');

   await octokit.rest.repos.uploadReleaseAsset({
      owner,
      repo,
      release_id: release.id,
      name: 'install.tgz',
      data: tgzBuffer,
   });

   return release;
}
