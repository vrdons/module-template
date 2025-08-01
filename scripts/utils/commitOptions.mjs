export const typeMap = {
   feat: { emoji: '✨', text: 'Features' },
   fix: { emoji: '🐛', text: 'Bug Fixes' },
   docs: { emoji: '📚', text: 'Documentation' },
   style: { emoji: '💄', text: 'Styles' },
   refactor: { emoji: '♻️', text: 'Code Refactoring' },
   test: { emoji: '✅', text: 'Tests' },
   chore: { emoji: '🔧', text: 'Chores' },
   ci: { emoji: '⚙️', text: 'Continuous Integration' },
   perf: { emoji: '⚡', text: 'Performance Improvements' },
   build: { emoji: '🏗️', text: 'Build System' },
   revert: { emoji: '⏪', text: 'Reverts' },
   lint: { emoji: '🧹', text: 'Linting' },
   pretty: { emoji: '🎨', text: 'Code Formatting' },
   config: { emoji: '🛠️', text: 'Configuration' },
   deps: { emoji: '📦', text: 'Dependency Updates' },
   release: { emoji: '🚀', text: 'Release' },
   wip: { emoji: '🚧', text: 'Work In Progress' },
};

export const typeKeys = Object.keys(typeMap);

export const commitLintConfig = {
   extends: ['@commitlint/config-conventional'],
   rules: {
      'type-enum': [2, 'always', typeKeys],
      'subject-case': [2, 'always', ['sentence-case']],
   },
};
