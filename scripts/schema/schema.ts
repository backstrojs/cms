import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

type SchemaValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| SchemaValue[]
	| { [key: string]: SchemaValue };

type SchemaCollection = {
	name: string;
	slug?: string;
	group?: string;
	mainField?: string;
	fields: Record<string, any>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveDefinitionsDir(): string {
	const candidateDirs = [
		path.resolve(process.cwd(), 'src/collections/definitions'),
		path.resolve(process.cwd(), 'collections/definitions'),
		path.resolve(__dirname, '../../collections/definitions'),
	];

	for (const candidateDir of candidateDirs) {
		if (fs.existsSync(candidateDir)) {
			return candidateDir;
		}
	}

	throw new Error(
		`Could not find collection definitions. Tried: ${candidateDirs.join(', ')}`,
	);
}

function parseDefinitions(): SchemaCollection[] {
	const definitionsDir = resolveDefinitionsDir();
	const files = fs
		.readdirSync(definitionsDir)
		.filter((file) => file.endsWith('.ts') && file !== 'index.ts')
		.sort();

	const collections: SchemaCollection[] = [];

	for (const file of files) {
		const fullPath = path.join(definitionsDir, file);
		const content = fs.readFileSync(fullPath, 'utf-8');
		const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
		const objectLiteral = findDefaultExportObject(source);
		if (!objectLiteral) {
			continue;
		}

		const parsed = parseObjectLiteral(objectLiteral);
		if (!isSchemaCollection(parsed)) {
			continue;
		}

		collections.push(parsed);
	}

	return collections;
}

function findDefaultExportObject(source: ts.SourceFile): ts.ObjectLiteralExpression | undefined {
	for (const statement of source.statements) {
		if (!ts.isExportAssignment(statement)) {
			continue;
		}

		const expression = statement.expression;
		if (ts.isAsExpression(expression) && ts.isObjectLiteralExpression(expression.expression)) {
			return expression.expression;
		}
		if (ts.isObjectLiteralExpression(expression)) {
			return expression;
		}
	}

	return undefined;
}

function parseObjectLiteral(objectLiteral: ts.ObjectLiteralExpression): { [key: string]: SchemaValue } {
	const result: { [key: string]: SchemaValue } = {};

	for (const prop of objectLiteral.properties) {
		if (!ts.isPropertyAssignment(prop)) {
			continue;
		}

		const key = getPropertyName(prop.name);
		if (!key) {
			continue;
		}

		result[key] = parseNodeValue(prop.initializer);
	}

	return result;
}

function parseNodeValue(node: ts.Expression): SchemaValue {
	if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
		return node.text;
	}
	if (ts.isNumericLiteral(node)) {
		return Number(node.text);
	}
	if (node.kind === ts.SyntaxKind.TrueKeyword) {
		return true;
	}
	if (node.kind === ts.SyntaxKind.FalseKeyword) {
		return false;
	}
	if (node.kind === ts.SyntaxKind.NullKeyword) {
		return null;
	}
	if (ts.isArrayLiteralExpression(node)) {
		return node.elements.map((el) => (ts.isExpression(el) ? parseNodeValue(el) : undefined));
	}
	if (ts.isObjectLiteralExpression(node)) {
		return parseObjectLiteral(node);
	}

	// Unsupported expression (identifiers, function calls, etc.) is omitted from schema extraction.
	return undefined;
}

function getPropertyName(name: ts.PropertyName): string | undefined {
	if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
		return name.text;
	}
	return undefined;
}

function isSchemaCollection(value: any): value is SchemaCollection {
	return (
		value &&
		typeof value === 'object' &&
		typeof value.name === 'string' &&
		value.fields &&
		typeof value.fields === 'object'
	);
}

const schema = parseDefinitions();

export default schema;
