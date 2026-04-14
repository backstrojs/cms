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
