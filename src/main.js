const chalk = require('chalk');
const execa = require('execa');
const fs = require('fs');
const gitignore = require('gitignore');
const Listr = require('listr');
const ncp = require('ncp');
const path = require('path');
const { projectInstall } = require('pkg-install');
const license = require('spdx-license-list/licenses/MIT');
const { promisify } = require('util');
const { fileURLToPath } = require('url');

const access = promisify(fs.access);
const writeFile = promisify(fs.writeFile);
const copy = promisify(ncp);
const writeGitignore = promisify(gitignore.writeFile);

async function copyTemplateFiles(options) {
  return copy(options.templateDirectory, options.targetDirectory, {
    clobber: false,
  });
}

async function createGitignore(options) {
  const file = fs.createWriteStream(
    path.join(options.targetDirectory, '.gitignore'),
    { flags: 'a' }
  );
  return writeGitignore({
    type: 'Node',
    file: file,
  });
}

async function createLicense(options) {
  const targetPath = path.join(options.targetDirectory, 'LICENSE');
  const licenseContent = license.licenseText
    .replace('<year>', new Date().getFullYear())
    .replace('<copyright holders>', `${options.name} (${options.email})`);
  return writeFile(targetPath, licenseContent, 'utf8');
}

async function initGit(options) {
  const result = await execa('git', ['init'], {
    cwd: options.targetDirectory,
  });
  if (result.failed) {
    return Promise.reject(new Error('Failed to initialize git'));
  }
  return;
}

export async function createProject(options) {
  options = {
    ...options,
    targetDirectory: options.targetDirectory || process.cwd(),
    email: 'keanutimmermans8@gmail.com',
    name: 'Keanu Timmermans',
  };

  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    '../../templates',
    options.template
  );
  options.templateDirectory = templateDir;

  try {
    await access(templateDir, fs.constants.R_OK);
  } catch (err) {
    console.error('%s Invalid template name', chalk.red.bold('ERROR'));
    process.exit(1);
  }

  const tasks = new Listr(
    [
      {
        title: 'Copy project files',
        task: () => copyTemplateFiles(options),
      },
      {
        title: 'Create gitignore',
        task: () => createGitignore(options),
      },
      {
        title: 'Create License',
        task: () => createLicense(options),
      },
      {
        title: 'Initialize git',
        task: () => initGit(options),
        enabled: () => options.git,
      },
      {
        title: 'Install dependencies',
        task: () =>
          projectInstall({
            cwd: options.targetDirectory,
          }),
        skip: () =>
          !options.runInstall
            ? 'Pass --install to automatically install dependencies'
            : undefined,
      },
    ],
    {
      exitOnError: false,
    }
  );

  await tasks.run();
  console.log('%s Project ready', chalk.green.bold('DONE'));
  return true;
}
