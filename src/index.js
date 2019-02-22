#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { getChangedFilesForRoots } = require('jest-changed-files');

const yargs = require('yargs')
	.scriptName('only-changed')
	.usage(
		'$0 <script>',
		'Run a script with changed files as arguments',
		yargs => {
			yargs
				.option('changedSince', {
					describe:
						'the git revision since which to get a list of changed files',
					string: true,
					requiresArg: true,
				})
				.option('extensions', {
					array: true,
					string: true,
					default: [],
				})
				.positional('script', { string: true, demandOption: true });
		},
	)
	.help()
	.showHelpOnFail(true)
	.strict()
	.parse();

async function main() {
	const { script, _: scriptArgs, extensions, changedSince } = yargs;

	const { changedFiles } = await getChangedFilesForRoots(['.'], {
		roots: ['.'],
		lastCommit: changedSince !== undefined ? undefined : true,
		changedSince,
	});

	const filteredFiles = Array.from(changedFiles)
		.filter(
			file =>
				extensions.length === 0 || extensions.includes(path.extname(file)),
		)
		.filter(file => fs.existsSync(file) && fs.statSync(file).isFile())
		.map(file => path.relative(process.cwd(), file));

	if (filteredFiles.length === 0) {
		return;
	}

	const args = scriptArgs.concat(filteredFiles);

	const child = spawn(script, args, { shell: os.platform() === 'win32' });

	child.stdout.pipe(process.stdout);
	child.stderr.pipe(process.stderr);
}

main();
