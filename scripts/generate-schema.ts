/**
 * Generate .zmodel files from programmatic collection definitions.
 *
 * Usage:
 *   npx tsx scripts/generate-schema.ts                      # writes to zenstack/schema.zmodel
 *   npx tsx scripts/generate-schema.ts --out schema.zmodel # writes to a custom file
 *   npx tsx scripts/generate-schema.ts --stdout            # prints to stdout
 */
import fs from 'node:fs';
import path from 'node:path';
import { generateSchemaFromConfig } from './schema/generator';
import schema from './schema/schema';

const defaultOutPath = path.join('zenstack', 'schema.zmodel');

async function main() {
	const outIndex = process.argv.indexOf('--out');
	const stdout = process.argv.includes('--stdout');
	const outPath = stdout ? undefined : outIndex !== -1 ? process.argv[outIndex + 1] : defaultOutPath;

	const content = await generateSchemaFromConfig(schema);

	if (outPath) {
		fs.mkdirSync(path.dirname(outPath), { recursive: true });
		fs.writeFileSync(outPath, content, 'utf-8');
		console.log(`Schema written to ${outPath}`);
	} else {
		console.log(content);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
