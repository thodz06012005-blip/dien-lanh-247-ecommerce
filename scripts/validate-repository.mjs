import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = resolve(fileURLToPath(new URL('.', import.meta.url)));
const DEFAULT_ROOT = resolve(SCRIPT_DIR, '..');

const REQUIRED_FILES = [
  '.editorconfig',
  '.gitattributes',
  '.gitignore',
  '.npmrc',
  '.nvmrc',
  '.prettierignore',
  '.prettierrc.json',
  'CONTRIBUTING.md',
  'README.md',
  '.github/pull_request_template.md',
  '.github/workflows/ci.yml',
  'frontend-user/.env.example',
  'frontend-user/package-lock.json',
  'frontend-user/src/app/AppProviders.tsx',
  'frontend-user/src/components/errors/AppErrorBoundary.tsx',
  'frontend-user/src/config/env.ts',
  'frontend-user/src/router/AppRouter.tsx',
  'frontend-admin/.env.example',
  'frontend-admin/package-lock.json',
  'frontend-admin/src/app/AppProviders.tsx',
  'frontend-admin/src/components/errors/AppErrorBoundary.tsx',
  'frontend-admin/src/config/env.ts',
  'frontend-admin/src/router/AppRouter.tsx',
  'backend/.env.example',
  'backend/package-lock.json',
  'backend/prisma/schema.prisma',
  'backend/prisma/seed.ts',
  'backend/src/common/constants/error-codes.ts',
  'backend/src/common/exceptions/business.exception.ts',
  'backend/src/common/filters/http-exception.filter.ts',
  'backend/src/common/interceptors/api-response.interceptor.ts',
  'backend/src/common/interfaces/api-response.interface.ts',
  'backend/src/config/environment.ts',
];

const PACKAGE_REQUIREMENTS = {
  'package.json': ['lint', 'typecheck', 'test', 'build', 'check:all', 'ci'],
  'frontend-user/package.json': [
    'dev',
    'build',
    'lint',
    'typecheck',
    'test:architecture',
    'check',
  ],
  'frontend-admin/package.json': [
    'dev',
    'build',
    'lint',
    'typecheck',
    'test:architecture',
    'check',
  ],
  'backend/package.json': [
    'build',
    'lint',
    'typecheck',
    'test',
    'test:architecture',
    'prisma:validate',
    'prisma:generate',
    'check',
  ],
};

const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bghp_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
  /\bsk-[A-Za-z0-9]{20,}\b/,
];

function readJson(root, file) {
  return JSON.parse(readFileSync(join(root, file), 'utf8'));
}

function trackedFiles(root) {
  try {
    const output = execFileSync('git', ['ls-files', '-z'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return output.split('\0').filter(Boolean);
  } catch {
    return [];
  }
}

function isAllowedEnvironmentFile(file) {
  const name = basename(file);
  return name === '.env.example' || /^\.env\..+\.example$/.test(name);
}

export function validateRepository(root = DEFAULT_ROOT) {
  const repositoryRoot = resolve(root);
  const errors = [];
  const warnings = [];

  for (const file of REQUIRED_FILES) {
    if (!existsSync(join(repositoryRoot, file))) {
      errors.push(`Missing required file: ${file}`);
    }
  }

  for (const [file, requiredScripts] of Object.entries(PACKAGE_REQUIREMENTS)) {
    const absolute = join(repositoryRoot, file);
    if (!existsSync(absolute)) continue;

    try {
      const packageJson = readJson(repositoryRoot, file);
      for (const script of requiredScripts) {
        if (!packageJson.scripts?.[script]) {
          errors.push(`${file} is missing script: ${script}`);
        }
      }
    } catch (error) {
      errors.push(`${file} is not valid JSON: ${error.message}`);
    }
  }

  const files = trackedFiles(repositoryRoot);
  for (const file of files) {
    const name = basename(file);
    if (name === '.env' || (name.startsWith('.env.') && !isAllowedEnvironmentFile(file))) {
      errors.push(`Real environment file must not be tracked: ${file}`);
    }
  }

  for (const file of files.filter((entry) => isAllowedEnvironmentFile(entry))) {
    const absolute = join(repositoryRoot, file);
    if (!existsSync(absolute)) continue;
    const contents = readFileSync(absolute, 'utf8');
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(contents)) {
        errors.push(`Potential secret detected in ${file}: ${pattern}`);
      }
    }
  }

  const aliasFiles = [
    'frontend-user/tsconfig.app.json',
    'frontend-admin/tsconfig.app.json',
    'backend/tsconfig.json',
  ];
  for (const file of aliasFiles) {
    const absolute = join(repositoryRoot, file);
    if (!existsSync(absolute)) continue;
    const contents = readFileSync(absolute, 'utf8');
    if (!contents.includes('"@/*"')) {
      errors.push(`${file} must declare the @/* import alias`);
    }
  }

  if (files.length === 0) {
    warnings.push('Unable to inspect tracked files because Git metadata is unavailable.');
  }

  return {
    root: repositoryRoot,
    errors,
    warnings,
    checkedFiles: REQUIRED_FILES.length,
    trackedFiles: files.length,
  };
}

function printResult(result) {
  console.log(`Repository: ${result.root}`);
  console.log(`Required files checked: ${result.checkedFiles}`);
  console.log(`Tracked files inspected: ${result.trackedFiles}`);

  for (const warning of result.warnings) {
    console.warn(`WARN: ${warning}`);
  }

  if (result.errors.length > 0) {
    for (const error of result.errors) {
      console.error(`ERROR: ${error}`);
    }
    console.error(`Repository validation failed with ${result.errors.length} error(s).`);
    return 1;
  }

  console.log('Repository validation passed.');
  return 0;
}

const isDirectExecution =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectExecution) {
  process.exitCode = printResult(validateRepository());
}
