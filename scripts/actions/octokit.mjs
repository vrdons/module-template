import { Octokit } from '@octokit/rest';
import { getRepoInfo } from '../exec.mjs';

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
 * @param {Octokit} octokit - Octokit örneği
 * @param {string} owner - Repo sahibi
 * @param {string} repo - Repo adı
 * @param {string} from - Base commit/tag/SHA
 * @param {string} to - Head commit/tag/SHA (varsayılan: default branch HEAD)
 * @returns {Promise<Array>} - Commit listesi
 */
export async function getCommitsBetween(octokit, owner, repo, from, to = 'HEAD') {
   try {
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
            body: commit.commit.message.split('\n').slice(1).join('\n').trim(),
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
