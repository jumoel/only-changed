#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const debug = require('debug')('only-changed');
const { getChangedFilesForRoots } = require('jest-changed-files');
const { bucketFiles } = require('./bucketFiles');

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

debug('Parsed args: %o', yargs);

const MAX_WIN32_CLI_LENGTH = 8191;
const IS_WINDOWS = os.platform() === 'win32';

async function spawnPromise(script, args, options = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(script, args, { ...options, stdio: 'inherit' });

		child.on('error', reject);

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

	let changedFiles;

	try {
		debug('Getting changes files');
		const changedFilesForRoots = await getChangedFilesForRoots(['.'], {
			roots: ['.'],
			changedSince,
		});

		changedFiles = changedFilesForRoots.changedFiles;
	} catch (err) {
		debug('Getting changed files failed');
		console.error(err);
		process.exit(1);
	}

	debug('Filtering %d files', changedFiles.size);

	const filteredFiles = Array.from(changedFiles)
		.filter(
			file =>
				extensions.length === 0 || extensions.includes(path.extname(file)),
		)
		.filter(file => fs.existsSync(file) && fs.statSync(file).isFile())
		.map(file => path.relative(process.cwd(), file));

	debug('Filtered file count is %d', filteredFiles.length);

	if (filteredFiles.length === 0) {
		return;
	}

	const baseLength = script.length + scriptArgs.join(' ').length + 1;
	const remainingLength = MAX_WIN32_CLI_LENGTH - baseLength;

	const fileGroups =
		splitCommandLineOnWindows && IS_WINDOWS
			? bucketFiles(filteredFiles, remainingLength)
			: [filteredFiles];

	for (const files of fileGroups) {
		try {
			const args = scriptArgs.concat(files);
			await spawnPromise(script, args, { shell: IS_WINDOWS });
		} catch (err) {
			console.error(err);

			const code = err.code || 1;
			process.exit(code);
		}
	}
}

try {
	main();
} catch (err) {
	console.error(err);
	process.exit(1);
}
