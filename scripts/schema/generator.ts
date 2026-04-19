import { formatDocument } from '@zenstackhq/language';
import type { Collection, CollectionField } from '../../src/collections';

type ScalarFieldType =
	| 'string'
	| 'text'
	| 'storage'
	| 'number'
	| 'int'
	| 'float'
	| 'decimal'
	| 'boolean'
	| 'datetime'
	| 'date'
	| 'json'
	| 'enum'
	| 'relation';

type CollectionConfig = {
	name: string;
	hidden?: boolean;
	fields: Record<string, CollectionField>;
};

type ModelField = {
	name: string;
	type: string;
	optional?: boolean;
	array?: boolean;
	attributes?: string[];
};

type ModelShape = {
	name: string;
	hidden?: boolean;
	fields: ModelField[];
	indexes: string[];
};

type EnumShape = {
	name: string;
	values: string[];
};

type RelationOpposite = {
	name: string;
	sourceModel: string;
	sourceField: string;
};

const TYPE_MAP: Record<string, string> = {
	string: 'String',
	text: 'String',
	richtext: 'String',
	storage: 'String',
	number: 'Int',
	int: 'Int',
	float: 'Float',
	decimal: 'Float',
	boolean: 'Boolean',
	datetime: 'DateTime',
	date: 'DateTime',
	json: 'Json',
};

export async function generateSchemaFromConfig(collections: Collection[]): Promise<string> {
	const normalizedCollections = collections.map(normalizeCollection);
	const models = new Map<string, ModelShape>();
	const enums = new Map<string, EnumShape>();
	const relationOpposites = new Map<string, RelationOpposite[]>();

	for (const collection of normalizedCollections) {
		const model: ModelShape = {
			name: collection.name,
			hidden: collection.hidden,
			fields: [],
			indexes: [],
		};

		const hasExplicitId = Object.entries(collection.fields).some(([, field]) => field.id === true);
		if (!hasExplicitId) {
			model.fields.push({
				name: 'id',
				type: 'String',
				attributes: ['@id', '@default(cuid())'],
			});
		}

		for (const [fieldName, field] of Object.entries(collection.fields)) {
			if (field.type === 'relation') {
				const targetModel = field.collection;
				if (!targetModel || field.multiple) {
					continue;
				}

				const relatedCollection = normalizedCollections.find((item) => item.name === targetModel);
				const relatedIdField = relatedCollection
					? getCollectionIdField(relatedCollection.fields)
					: 'id';
				const relatedIdType = relatedCollection
					? getFieldZenType(relatedCollection.fields[relatedIdField])
					: 'String';

				const relationIdFieldName = buildRelationIdFieldName(fieldName, relatedIdField);
				model.fields.push({
					name: relationIdFieldName,
					type: relatedIdType,
					optional: !field.required,
				});

				model.fields.push({
					name: fieldName,
					type: targetModel,
					optional: !field.required,
					attributes: [
						`@relation("${fieldName}${model.name}", fields: [${relationIdFieldName}], references: [${relatedIdField}], onDelete: ${upperCaseFirst(field.onDelete || 'setNull')})`,
					],
				});

				if (field.index) {
					model.indexes.push(relationIdFieldName);
				}

				if (!relationOpposites.has(targetModel)) {
					relationOpposites.set(targetModel, []);
				}
				relationOpposites.get(targetModel)?.push({
					name: pluralize(lowerCaseFirst(collection.name)),
					sourceModel: collection.name,
					sourceField: fieldName,
				});
				continue;
			}

			if (field.type === 'enum') {
				const enumName = `${collection.name}${upperCaseFirst(fieldName)}Enum`;
				if (!enums.has(enumName)) {
					enums.set(enumName, {
						name: enumName,
						values: (field.options ?? []).map((value) => sanitizeEnumValue(value)),
					});
				}

				const attrs: string[] = [];
				if (field.required === false) {
					// optional marker is handled by field optional flag
				}
				if (field.default !== undefined && typeof field.default !== 'function') {
					attrs.push(`@default(${formatEnumDefaultValue(field.default)})`);
				}
				if (field.unique) {
					attrs.push('@unique');
				}
				if (field.id) {
					attrs.push('@id');
				}

				model.fields.push({
					name: fieldName,
					type: enumName,
					optional: !field.required && !field.multiple,
					array: !!field.multiple,
					attributes: attrs,
				});

				if (field.index) {
					model.indexes.push(fieldName);
				}
				continue;
			}

			const attrs: string[] = [];
			if (field.id) {
				attrs.push('@id');
			}
			if (field.unique) {
				attrs.push('@unique');
			}
			if (field.default !== undefined && typeof field.default !== 'function') {
				attrs.push(`@default(${formatScalarDefaultValue(field.default)})`);
			}
			if (field.updatedAt) {
				attrs.push('@updatedAt');
			}

			model.fields.push({
				name: fieldName,
				type: getFieldZenType(field),
				optional: !field.required && !field.multiple,
				array: !!field.multiple,
				attributes: attrs,
			});

			if (field.index) {
				model.indexes.push(fieldName);
			}
		}

		models.set(collection.name, model);
	}

	for (const [targetModelName, oppositeDefs] of relationOpposites.entries()) {
		const targetModel = models.get(targetModelName);
		if (!targetModel) {
			continue;
		}

		for (const opposite of oppositeDefs) {
			const oppositeName = opposite.name;
			if (targetModel.fields.some((field) => field.name === oppositeName)) {
				continue;
			}

			const relFields = normalizedCollections.find(c => c.name === targetModelName)?.fields || {}
			const relFieldName = Object.keys(relFields).find(f => relFields[f].type == 'relation' && relFields[f].multiple && relFields[f].collection == opposite.sourceModel);

			targetModel.fields.push({
				name: relFieldName || oppositeName,
				type: opposite.sourceModel,
				array: true,
				attributes: [`@relation("${opposite.sourceField}${opposite.sourceModel}")`]
			});
		}
	}

	const schema = renderSchema([...enums.values()], [...models.values()]);

	try {
		return await formatDocument(schema);
	} catch {
		return schema;
	}
}

function normalizeCollection(collection: Collection): CollectionConfig {
	return {
		name: collection.name,
		fields: collection.fields as Record<string, CollectionField>,
		hidden: collection.hidden,
	};
}

function getCollectionIdField(fields: Record<string, CollectionField>): string {
	for (const [name, field] of Object.entries(fields)) {
		if (field.id) {
			return name;
		}
	}
	return 'id';
}

function getFieldZenType(field: CollectionField | undefined): string {
	if (!field) {
		return 'String';
	}
	if (field.type === 'enum') {
		return 'String';
	}
	if (field.type === 'relation') {
		return 'String';
	}
	return TYPE_MAP[field.type || field.dbType || 'string'];
}

function buildRelationIdFieldName(relationFieldName: string, relatedIdField: string): string {
	return `${relationFieldName}${upperCaseFirst(relatedIdField)}`;
}

function formatScalarDefaultValue(value: string | number | boolean): string {
	if (typeof value === 'string') {
		if (value === 'now()') {
			return value;
		}
		return `'${value.replace(/'/g, "\\'")}'`;
	}
	if (typeof value === 'boolean') {
		return value ? 'true' : 'false';
	}
	return value.toString();
}

function formatEnumDefaultValue(value: string | number | boolean): string {
	if (typeof value === 'string') {
		return sanitizeEnumValue(value);
	}
	if (typeof value === 'boolean') {
		return value ? 'true' : 'false';
	}
	return value.toString();
}

function renderSchema(enums: EnumShape[], models: ModelShape[]): string {
	const sections: string[] = [];

	sections.push("import 'auth'");
	sections.push('');
	sections.push('datasource db {');
	sections.push("\tprovider = 'postgresql'");
	sections.push("\turl = env('DATABASE_URL')");
	sections.push('}');
	sections.push('');
	sections.push('plugin ts {');
	sections.push("\tprovider = '@core/typescript'");
	sections.push('\tlite = true');
	sections.push("\toutput = './generated'");
	sections.push('}');
	sections.push('');

	for (const enumDef of enums) {
		if (enumDef.values.length === 0) {
			continue;
		}
		sections.push(`enum ${enumDef.name} {`);
		for (const value of enumDef.values) {
			sections.push(`\t${value}`);
		}
		sections.push('}');
		sections.push('');
	}

	for (const model of models) {
		sections.push(`model ${model.name} {`);

		for (const field of model.fields) {
			const optionalMark = field.optional ? '?' : '';
			const arrayMark = field.array ? '[]' : '';
			const attrs = field.attributes?.length ? ` ${field.attributes.join(' ')}` : '';
			sections.push(`\t${field.name}\t${field.type}${arrayMark}${optionalMark}${attrs}`);
		}

		sections.push('');

		sections.push(
			`\t@@map("${model.hidden ? '_' : ''}${model.name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[\s-]+/g, '_').toLowerCase()}")`
		);


		for (const indexField of uniq(model.indexes)) {
			sections.push(`\t@@index([${indexField}])`);
		}

		sections.push('}');
		sections.push('');
	}

	return `${sections.join('\n').trim()}\n`;
}

function pluralize(value: string): string {
	if (value.endsWith('y') && !/[aeiou]y$/i.test(value)) {
		return `${value.slice(0, -1)}ies`;
	}
	if (/(s|x|z|ch|sh)$/i.test(value)) {
		return `${value}es`;
	}
	return `${value}s`;
}

function lowerCaseFirst(value: string): string {
	return value.charAt(0).toLowerCase() + value.slice(1);
}

function upperCaseFirst(value: string): string {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

function sanitizeEnumValue(value: string): string {
	const sanitized = value
		.replace(/[^A-Za-z0-9_]/g, '_')
		.replace(/^[^A-Za-z_]/, '_$&');
	return sanitized.toUpperCase();
}

function uniq<T>(values: T[]): T[] {
	return [...new Set(values)];
}
