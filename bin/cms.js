#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceBinDir = path.resolve(process.cwd(), 'node_modules', '.bin');
const generateScript = path.resolve(__dirname, '../scripts/generate-schema.ts');

const require = createRequire(import.meta.url);
const tsxCli = require.resolve('tsx/cli');

const commands = {
	generate: {
		description: 'Run Better Auth, Backstro, and ZenStack code generation.',
		run(commandArgs) {
			runWorkspaceBinary('better-auth', '@better-auth/cli', ['generate']);
			runProcess(process.execPath, [tsxCli, generateScript, ...commandArgs], 'Backstro schema generation');
			runWorkspaceBinary('zen', '@zenstackhq/cli', ['generate']);
		},
	},
};

const [command, ...args] = process.argv.slice(2);

if (!command || command === 'help' || command === '--help' || command === '-h') {
	printHelp(0);
}

const selectedCommand = commands[command];

if (!selectedCommand) {
	console.error(`Unknown command: ${command}`);
	printHelp(1);
}

selectedCommand.run(args);
process.exit(0);

function runWorkspaceBinary(binaryName, packageName, commandArgs) {
	runProcess(binaryName, commandArgs, `${packageName} generation`, packageName);
}

function runProcess(commandName, commandArgs, label, packageName) {
	console.log(`Running ${label}...`);

	const result = spawnSync(commandName, commandArgs, {
		cwd: process.cwd(),
		env: getCommandEnv(),
		shell: process.platform === 'win32',
		stdio: 'inherit',
	});

	if (result.error) {
		if (result.error.code === 'ENOENT' && packageName) {
			console.error(
				`Unable to find '${commandName}' from ${process.cwd()}. Install ${packageName} in the consuming app and try again.`
			);
		} else {
			console.error(result.error.message);
		}
		process.exit(1);
	}

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

function getCommandEnv() {
	return {
		...process.env,
		PATH: [workspaceBinDir, process.env.PATH ?? ''].filter(Boolean).join(path.delimiter),
	};
}

function printHelp(exitCode) {
	console.log('Usage: npx @backstro/cms <command> [options]');
	console.log('');
	console.log('Commands:');
	for (const [name, commandConfig] of Object.entries(commands)) {
		console.log(`  ${name.padEnd(10)} ${commandConfig.description}`);
	}
	process.exit(exitCode);
}
