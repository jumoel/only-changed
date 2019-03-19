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
				.option('splitCommandLineOnWindows', {
					boolean: true,
					default: false,
					describe:
						'supplying this flag runs the command multiple times, if a single invocation would result in a too long argument list',
				})
				.positional('script', { string: true, demandOption: true });
		},
	)
	.help()
	.showHelpOnFail(true)
	.strict()
	.parse();

const MAX_WIN32_CLI_LENGTH = 8191;
const IS_WINDOWS = os.platform() === 'win32';

async function spawnPromise(script, args, options = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(script, args, options);

		child.stdout.pipe(process.stdout);
		child.stderr.pipe(process.stderr);

		child.on('exit', (code, signal) => {
			if (signal || code !== 0) {
				reject({ code, signal });
				return;
			}

			resolve();
		});
	});
}

async function main() {
	const {
		script,
		_: scriptArgs,
		extensions,
		changedSince,
		splitCommandLineOnWindows,
	} = yargs;

	const { changedFiles } = await getChangedFilesForRoots(['.'], {
		roots: ['.'],
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

	let buckets = 1;

	if (splitCommandLineOnWindows && IS_WINDOWS) {
		// The +1 is for the space between script and scriptArgs
		const baseLength = script.length + scriptArgs.join(' ').length + 1;
		const remainingLength = MAX_WIN32_CLI_LENGTH - baseLength;
		const fileLength = filteredFiles.join(' ').length;

		if (fileLength > remainingLength) {
			// We use one more bucket than necessary, just to be more safe against
			// outliers in path length ¯\_(ツ)_/¯
			buckets = Math.ceil(fileLength / remainingLength) + 1;
		}
	}

	const fileGroups = filteredFiles.reduce((acc, file, index) => {
		const bucketNumber = index % buckets;

		if (acc.length < bucketNumber + 1) {
			acc.push([]);
		}

		acc[bucketNumber].push(file);

		return acc;
	}, []);

	for (const files of fileGroups) {
		const args = scriptArgs.concat(files);
		await spawnPromise(script, args, { shell: IS_WINDOWS });
	}
}

main();
