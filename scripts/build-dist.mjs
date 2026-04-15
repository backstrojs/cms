#!/usr/bin/env node

import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.resolve(__dirname, '..');
const sourceDir = path.resolve(packageDir, 'src');
const outputDir = path.resolve(packageDir, 'dist');
const globalStylesheetInput = path.resolve(sourceDir, 'assets', 'global.css');
const globalStylesheetOutput = path.resolve(outputDir, 'assets', 'global.css');

rmSync(outputDir, { recursive: true, force: true });

const require = createRequire(import.meta.url);
const tscCli = require.resolve('typescript/bin/tsc');
const buildResult = spawnSync(
	process.execPath,
	[tscCli, '-p', path.resolve(packageDir, 'tsconfig.build.json')],
	{
		cwd: packageDir,
		env: process.env,
		stdio: 'inherit',
	}
);

if (buildResult.status !== 0) {
	process.exit(buildResult.status ?? 1);
}

copyNonTypeScriptFiles(sourceDir, outputDir);
buildGlobalStylesheet();

function buildGlobalStylesheet() {
	mkdirSync(path.dirname(globalStylesheetOutput), { recursive: true });

	const tailwindCliPackageJson = require.resolve('@tailwindcss/cli/package.json');
	const tailwindCli = path.resolve(path.dirname(tailwindCliPackageJson), 'dist', 'index.mjs');
	const buildResult = spawnSync(
		process.execPath,
		[tailwindCli, '-i', globalStylesheetInput, '-o', globalStylesheetOutput, '--minify'],
		{
			cwd: sourceDir,
			env: process.env,
			stdio: 'inherit',
		}
	);

	if (buildResult.status !== 0) {
		process.exit(buildResult.status ?? 1);
	}
}

function copyNonTypeScriptFiles(fromDir, toDir) {
	mkdirSync(toDir, { recursive: true });

	for (const entry of readdirSync(fromDir)) {
		const sourcePath = path.join(fromDir, entry);
		const outputPath = path.join(toDir, entry);
		const stats = statSync(sourcePath);

		if (stats.isDirectory()) {
			copyNonTypeScriptFiles(sourcePath, outputPath);
			continue;
		}

		if (shouldCopyFile(entry)) {
			copyFileSync(sourcePath, outputPath);
		}
	}
}

function shouldCopyFile(fileName) {
	return !/\.(?:cts|mts|ts|tsx)$/.test(fileName);
}
