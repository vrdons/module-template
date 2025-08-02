import { resolve } from 'path';
import { getCommitsBetween, repoURL, getGitTags, owner, repo } from '../utils/octokit.mjs';
import { writeFileSync } from 'fs';
import { typeMap } from '../utils/commitOptions.mjs';
const changelogHeader =
   '# Changelog\n' +
   '\n' +
   'All notable changes to this project will be documented in this file.\n' +
   '\n' +
   'The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\n' +
   'and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n' +
   '\n';
const outputPath = resolve(process.cwd(), 'CHANGELOG.md');

if (import.meta.url === `file://${process.argv[1]}`) {
   void generateChangelog().then(changelogContent => {
      writeFileSync(outputPath, changelogContent, 'utf8');
      console.log('✅ Changelog generated successfully!');
      console.log(`📝 Written to: ${outputPath}`);
   });
}
function getCommitHash(fullHash) {
   return fullHash.substring(0, 7);
}

export function formatCommitLink(hash, repoUrl) {
   const shortHash = getCommitHash(hash);
   return `[${shortHash}](${repoUrl}/commit/${hash})`;
}
export function parseCommit(commit) {
   const coAuthors = [];
   if (commit.body) {
      const coAuthorRegex = /Co-authored-by:\s*([^<]+)<([^>]+)>/g;
      let coAuthorMatch;
      while ((coAuthorMatch = coAuthorRegex.exec(commit.body)) !== null) {
         const [, name, email] = coAuthorMatch;
         coAuthors.push({ name: name.trim(), email: email.trim() });
      }
   }

   function formatAuthor(name, email) {
      const isBot = email.includes('[bot]') || name.includes('[bot]') || name.includes('dependabot');
      if (isBot) {
         return `[@${name.replace(/\[bot\]/g, '')}[bot]](https://github.com/${name.replace(/\[bot\]/g, '')})`;
      } else {
         let username = name;
         if (email.includes('@users.noreply.github.com')) {
            username = email.split('@')[0];
         }
         return `[@${username}](https://github.com/${username})`;
      }
   }

   let authorInfo = '';
   if (commit.authorName && commit.authorEmail) {
      authorInfo = `by ${formatAuthor(commit.authorName, commit.authorEmail)}`;
      if (coAuthors.length > 0) {
         const coAuthorLinks = coAuthors.map(coAuthor => formatAuthor(coAuthor.name, coAuthor.email));
         authorInfo += `, ${coAuthorLinks.join(', ')}`;
      }
   }

   const conventionalRegex =
      /(?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]+\s*)?(\w+)(?:\(([^)]+)\))?: ([^\p{Emoji_Presentation}\p{Extended_Pictographic}]+)/gu;
   const matches = [...commit.body.matchAll(conventionalRegex)];

   if (matches.length > 0) {
      // Return multiple parsed commits for each conventional commit found
      return matches.map(match => {
         const [, type, scope, description] = match;
         return {
            type: type,
            scope: scope,
            description: description.trim(),
            hash: commit.hash,
            date: commit.date,
            author: authorInfo,
         };
      });
   }

   // Fallback for non-conventional commits
   return [
      {
         type: 'chore',
         scope: null,
         description: commit.subject,
         hash: commit.hash,
         date: commit.date,
         author: authorInfo,
      },
   ];
}
export async function generateUncommittedChangelog() {
   const tags = await getGitTags(owner, repo);
   const uniqueTags = [...new Set(tags)].filter(tag => tag);
   const unreleasedCommits = await getCommitsBetween(owner, repo, uniqueTags[0] ?? '');
   let changelog = '';
   if (unreleasedCommits.length > 0) {
      const parsedCommits = unreleasedCommits.flatMap(parseCommit);
      const groupedCommits = {};

      parsedCommits.forEach(commit => {
         const typeLabel = typeMap[commit.type] ? commit.type : typeMap.chore;
         if (!groupedCommits[typeLabel]) {
            groupedCommits[typeLabel] = [];
         }
         groupedCommits[typeLabel].push(commit);
      });

      const typeOrder = Object.keys(typeMap);

      typeOrder.forEach(typeLabel => {
         if (groupedCommits[typeLabel]) {
            const label = typeMap[typeLabel];
            changelog += `### ${label.emoji} ${label.text}\n\n`;
            groupedCommits[typeLabel].forEach(commit => {
               const commitLink = formatCommitLink(commit.hash, repoURL);
               const scopeText = commit.scope ? `**${commit.scope}:** ` : '';
               changelog += `- ${scopeText}${commit.description} ${commit.author} (${commitLink})\n`;
            });
            changelog += '\n';
         }
      });
   }
   return changelog;
}

async function generateChangelog() {
   const tags = await getGitTags(owner, repo);
   const uniqueTags = [...new Set(tags)].filter(tag => tag);
   let changelog = changelogHeader;
   const unreleasedCommits = await getCommitsBetween(owner, repo, uniqueTags[0] ?? '');
   if (unreleasedCommits.length > 0) {
      const parsedCommits = unreleasedCommits.flatMap(parseCommit);
      const groupedCommits = {};

      parsedCommits.forEach(commit => {
         const typeLabel = typeMap[commit.type] ? commit.type : typeMap.chore;
         if (!groupedCommits[typeLabel]) {
            groupedCommits[typeLabel] = [];
         }
         groupedCommits[typeLabel].push(commit);
      });

      changelog += '## Latest\n\n';

      const typeOrder = Object.keys(typeMap);

      typeOrder.forEach(typeLabel => {
         if (groupedCommits[typeLabel]) {
            const label = typeMap[typeLabel];
            changelog += `### ${label.emoji} ${label.text}\n\n`;
            groupedCommits[typeLabel].forEach(commit => {
               const commitLink = formatCommitLink(commit.hash, repoURL);
               const scopeText = commit.scope ? `**${commit.scope}:** ` : '';
               changelog += `- ${scopeText}${commit.description} ${commit.author} (${commitLink})\n`;
            });
            changelog += '\n';
         }
      });
   }

   for (let i = 0; i < uniqueTags.length; i++) {
      const currentTag = uniqueTags[i];
      const previousTag = uniqueTags[i + 1];
      // eslint-disable-next-line no-await-in-loop
      const commits = await getCommitsBetween(owner, repo, previousTag, currentTag);
      if (commits.length === 0) continue;

      const parsedCommits = commits.flatMap(parseCommit);
      const groupedCommits = {};
      parsedCommits.forEach(commit => {
         const typeLabel = typeMap[commit.type] ? commit.type : typeMap.chore;
         if (!groupedCommits[typeLabel]) {
            groupedCommits[typeLabel] = [];
         }
         groupedCommits[typeLabel].push(commit);
      });

      const compareUrl = previousTag ? `${repoURL}/compare/${previousTag}...${currentTag}` : `${repoURL}/releases/tag/${currentTag}`;
      const versionDate = parsedCommits[0]?.date || new Date().toISOString().split('T')[0];
      changelog += `## [${currentTag}](${compareUrl}) - ${versionDate}\n\n`;

      const typeOrder = Object.keys(typeMap);

      typeOrder.forEach(typeLabel => {
         if (groupedCommits[typeLabel]) {
            const label = typeMap[typeLabel];
            changelog += `### ${label.emoji} ${label.text}\n\n`;
            groupedCommits[typeLabel].forEach(commit => {
               const commitLink = formatCommitLink(commit.hash, repoURL);
               const scopeText = commit.scope ? `**${commit.scope}:** ` : '';
               changelog += `- ${scopeText}${commit.description} ${commit.author} (${commitLink})\n`;
            });
            changelog += '\n';
         }
      });
   }

   return changelog.replace(/\n{3,}/g, '\n\n');
}
