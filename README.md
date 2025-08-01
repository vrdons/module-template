# Module Template

A modern TypeScript module template with comprehensive tooling for development, building, and publishing.

## Features

- 🚀 **TypeScript** - Full TypeScript support with modern ES2024 target
- 📦 **Dual Package** - Supports both CommonJS and ESM formats
- 🔧 **Build System** - Fast builds with [tsup](https://tsup.egoist.dev/)
- 🎯 **Linting** - ESLint with TypeScript, Prettier, and JSON/Markdown support
- 🪝 **Git Hooks** - Automated linting and commit message validation with Husky
- 📋 **Conventional Commits** - Enforced commit message format
- 🔄 **Automated Releases** - Scripts for GitHub and NPM releases
- 📝 **Changelog Generation** - Automatic changelog generation
- 🧪 **Testing Ready** - Test directory structure included

## Quick Start

### Installation

```bash
# Clone the template
git clone https://github.com/vrdons/module-template.git
cd module-template

# Install dependencies
npm install
```

### Development

```bash
# Build the project
npm run build

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Project Structure

```text
module-template/
├── src/                    # Source code
│   └── index.ts           # Main entry point
├── dist/                  # Built output (generated)
├── tests/                 # Test files
├── scripts/               # Build and automation scripts
│   ├── actions/          # GitHub Actions and release scripts
│   ├── husky/            # Git hook scripts
│   └── utils/            # Utility functions
├── .github/              # GitHub workflows
├── .husky/               # Husky git hooks
└── ...config files
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build the project with tsup |
| `npm run lint` | Run ESLint on all files |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run changelog` | Generate changelog from commits |
| `npm run release:git` | Create GitHub release |
| `npm run release:npm` | Publish to NPM |

## Configuration

### TypeScript

The project uses modern TypeScript configuration with:

- **Target**: ES2024
- **Module**: NodeNext with full ESM/CJS interop
- **Output**: Dual package (ESM + CJS) with type declarations

### Build System

[tsup](https://tsup.egoist.dev/) is configured to:

- Bundle TypeScript source code
- Generate both ESM and CJS formats
- Create type declaration files
- Clean output directory on each build
- Run post-build patches

### Code Quality

- **ESLint**: TypeScript, Prettier, JSON, and Markdown linting
- **Prettier**: Code formatting with consistent style
- **Husky**: Pre-commit hooks for linting and commit message validation
- **Commitlint**: Enforces conventional commit format

## Package Exports

The module supports both CommonJS and ESM imports:

```javascript
// ESM
import { version } from 'module-template';

// CommonJS
const { version } = require('module-template');
```

## Development Workflow

1. **Make changes** to source code in [`src/`](src/)
2. **Build** with `npm run build`
3. **Lint** with `npm run lint`
4. **Commit** using conventional commit format
5. **Release** with automated scripts

### Commit Message Format

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```text
type(scope): description

feat: add new feature
fix: resolve bug
docs: update documentation
style: formatting changes
refactor: code restructuring
test: add tests
chore: maintenance tasks
```

## Release Process

### GitHub Release

```bash
npm run release:git
```

### NPM Release

```bash
npm run release:npm
```

## License

MIT License - see [`LICENSE`](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Follow the commit message format
5. Submit a pull request

## Author

**vrdons** - [GitHub Profile](https://github.com/vrdons)

---

This template provides a solid foundation for TypeScript modules with modern tooling and best practices. Customize it according to your project's specific needs.
