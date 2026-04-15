import type { APIContext } from 'astro';
import { upperCaseFirst } from '@zenstackhq/common-helpers';
import type { Component } from 'svelte';

export type CollectionField = {
	type: string;
	name?: string;
	required?: boolean;
	index?: boolean;
	multiple?: boolean;
	collection?: string;
	onDelete?: 'cascade' | 'setNull' | 'restrict';
	driver?: string;
	accept?: string;
	prefix?: string;
	default?: string | boolean | number | ((args: { operation: string }) => any);
	updatedAt?: true | ((args: { operation: string }) => any);
	[key: string]: any;
};

export type Collection = {
	name: string;
	slug: string;
	group?: string;
	table?: {
		columns: {
			header: string;
			key: string;
			align?: 'left' | 'right';
			sort?: boolean;
			value?: (args: { row: any }) => any;
			sortValue?: (args: { row: any }) => any;
			props?: () => Record<string, any>;
		}[];
	};
	hidden?: boolean;
	columns: string[];
	icon?: any;
	idField?: string;
	mainField: string;
	previewUrl?: string | ((row: any) => string);
	hooks?: {
		beforeChange?: ((args: { operation: string; args: any; context?: APIContext }) => Promise<any> | any)[];
		afterChange?: ((args: { operation: string; args: any; result: any; context?: APIContext }) => Promise<void> | void)[];
		beforeDelete?: ((args: { operation: string; args: any; context?: APIContext }) => Promise<any> | any)[];
		afterDelete?: ((args: { operation: string; args: any; result: any; context?: APIContext }) => Promise<void> | void)[];
	};
	access?: {
		create: (args: { context: APIContext }) => boolean | Promise<boolean> | Record<string, any>;
		read: (args: { context: APIContext }) => boolean | Promise<boolean> | Record<string, any>;
		update: (args: { context: APIContext }) => boolean | Promise<boolean> | Record<string, any>;
		delete: (args: { context: APIContext }) => boolean | Promise<boolean> | Record<string, any>;
	};
	fields: Record<string, CollectionField>;
};

type SchemaModel = {
	name: string;
	fields: Record<string, any>;
	attributes?: readonly any[];
};

type SchemaLike = {
	models: Record<string, SchemaModel>;
	enums: Record<string, any>;
};

type CollectionDefinitions = Record<string, Collection | undefined>;

export type SidebarItem = {
	title: string;
	url: string;
	children?: SidebarItem[];
	icon?: Component;
}

export type SidebarGroup = {
	title?: string;
	items: SidebarItem[];
	icon?: Component;
	slug?: string;
}

type BuildCollectionsArgs = {
	schema: SchemaLike;
	definitions: CollectionDefinitions;
};

const getIdField = (fields: Record<string, CollectionField>) => {
	return Object.values(fields).find((field) => field.id)?.name || 'id';
};

const cloneFields = (fields: Record<string, CollectionField> = {}) => {
	return Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, { ...field }]));
};

const getArgValue = (arg: any) => {
	return arg.value.value ?? arg.value.items.map((item: any) => item[item.kind] || item.value);
};

const getMeta = (args: any[]) => {
	let key: keyof Collection | undefined;
	let value: any;

	for (const arg of args) {
		if (arg.name === 'name') {
			key = arg.value.value;
		} else if (arg.name === 'value') {
			value = getArgValue(arg);
		}
	}

	if (key && value !== undefined) {
		return { [key]: value };
	}

	return {};
};

const getModelAttributes = (model: SchemaModel) => {
	let attributes: Partial<Collection> = {};

	if (model.attributes) {
		for (const attr of model.attributes) {
			if (attr.name === '@@meta') {
				attributes = { ...attributes, ...getMeta(attr.args) };
			}
		}
	}

	return attributes;
};

const getFieldAttributes = (field: any) => {
	if (field.attributes && Array.isArray(field.attributes)) {
		return field.attributes.reduce((acc: Record<string, any>, attr: any) => {
			const name = attr.name.replace('@', '');

			if (attr.args && !name.startsWith('db.')) {
				if (name === 'meta') {
					acc = { ...acc, ...getMeta(attr.args) };
				} else {
					for (const arg of attr.args) {
						if (arg.value.kind !== 'call' && arg.value.kind !== 'binary') {
							acc[name] = acc[name] || {};
							acc[name][arg.name] = getArgValue(arg);
						}
					}
				}
			}

			return acc;
		}, {});
	}

	return field.attributes || {};
};

export const buildCollections = ({
	schema,
	definitions,
}: BuildCollectionsArgs): Record<string, Collection> => {
	const collections: Record<string, Collection> = {};

	for (const model of Object.values(schema.models)) {
		if (definitions[model.name]) {
			const definition = definitions[model.name]!;
			const fields = cloneFields(definition.fields);
			const idField = getIdField(fields);

			collections[model.name] = {
				...definition,
				fields,
				idField,
				mainField: definition.mainField || idField,
				hooks: {
					beforeChange: [],
					afterChange: [],
					beforeDelete: [],
					afterDelete: [],
					...(definition.hooks || {}),
				},
			};

			for (const key of Object.keys(collections[model.name].fields)) {
				collections[model.name].fields[key].name = key;

				if (collections[model.name].fields[key].type === 'relation') {
					if (collections[model.name].fields[key].multiple) {
						const targetCollection = definitions[collections[model.name].fields[key].collection || ''];
						const targetKey = targetCollection
							? Object.keys(targetCollection.fields).find(
								(fieldName) =>
									targetCollection.fields[fieldName].type === 'relation' &&
									targetCollection.fields[fieldName].collection === model.name &&
									!targetCollection.fields[fieldName].multiple,
							)
							: undefined;

						if (targetKey) {
							collections[model.name].fields[key].field =
								collections[model.name].fields[key].field ||
								targetKey + upperCaseFirst(getIdField(collections[model.name].fields));
						}
					} else {
						const relationCollectionName = collections[model.name].fields[key].collection || '';
						const relationCollection = definitions[relationCollectionName];

						if (relationCollection) {
							collections[model.name].fields[key].field =
								collections[model.name].fields[key].field ||
								key + upperCaseFirst(getIdField(cloneFields(relationCollection.fields)));
						}
					}
				}
			}

			collections[model.name].hooks?.beforeChange?.push(async ({ operation, args }) => {
				for (const field of Object.values(collections[model.name].fields)) {
					if (field.default && typeof field.default === 'function' && args.data[field.name || ''] === undefined) {
						const value = await field.default({ operation });

						if (value !== undefined && field.name) {
							args.data[field.name] = value;
						}
					}
				}

				return args;
			});

			continue;
		}

		const slug = model.name.substring(0, 1).toLowerCase() + model.name.substring(1);

		const meta: Partial<Collection> = getModelAttributes(model);
		const fields: Record<string, CollectionField> = {};

		for (const field of Object.values(model.fields)) {
			const fieldCopy: Record<string, any> = { ...field, ...getFieldAttributes(field) };

			fieldCopy.required = !field.optional;

			if (fieldCopy.relation) {
				fieldCopy.collection = fieldCopy.type;
				fieldCopy.type = 'relation';
				fieldCopy.multiple = !!fieldCopy.array;

				if (!fieldCopy.multiple && field.relation?.fields?.[0]) {
					fieldCopy.field = field.relation.fields[0];
				}
			} else if (fieldCopy.driver) {
				fieldCopy.type = 'storage';
			} else if (schema.enums[field.type]) {
				fieldCopy.options = Object.values(schema.enums[field.type].values);
				fieldCopy.type = 'enum';
			} else {
				fieldCopy.type = fieldCopy.type.toLowerCase();
			}

			fields[field.name] = fieldCopy as CollectionField;
		}

		for (const field of Object.values(fields)) {
			if (field.relation && field.relation.fields && fields[field.relation.fields[0]]) {
				fields[field.relation.fields[0]].hidden = true;
			}
		}

		collections[model.name] = {
			slug,
			name: model.name,
			idField: getIdField(fields),
			mainField: Object.values(fields).find((field) => field.id)?.name || getIdField(fields),
			columns: Object.values(fields)
				.filter((field) => !field.hidden)
				.slice(0, 5)
				.map((field) => field.name || ''),
			hidden: model.attributes?.find((attr) => attr.name === '@@map')?.args?.[0]?.value?.value?.startsWith('_'),
			fields,
			...meta,
		};
	}

	for (const model of Object.values(collections)) {
		if (!definitions[model.name]) {
			for (const field of Object.values(collections[model.name].fields)) {
				if (field.relation && field.array && field.collection && collections[field.collection]) {
					field.field =
						collections[field.collection]?.fields[field.relation.opposite]?.field ||
						field.relation.opposite + upperCaseFirst(getIdField(collections[field.collection].fields));
				}
			}
		}
	}

	return collections;
};

const defineCollections = (args: BuildCollectionsArgs): Record<string, Collection> => {
	collections = buildCollections(args);

	globalConfig.__backstro_collections = collections;

	return collections
};

const getCollections = (): Record<string, Collection> => {
	if (!collections && !globalConfig.__backstro_collections) {
		throw new Error('Collections not defined. Please call defineCollections first.');
	}

	return collections || globalConfig.__backstro_collections!;
}

type GlobalWithBackstroConfig = typeof globalThis & {
	__backstro_collections?: Record<string, Collection> | null;
};

const globalConfig = globalThis as GlobalWithBackstroConfig;

let collections: Record<string, Collection> | null = null;

export { defineCollections, getCollections, collections };

export const defineGroups = (groups: Record<string, SidebarGroup>) => {
	for (const key in collections) {
		const collection = collections[key];

		if (!collection.hidden) {
			collection.group = collection.group || 'collections';
			groups[collection.group] = groups[collection.group] || {
				title: collection.group,
				items: [],
			};

			groups[collection.group].items.push({
				title: collection.name,
				url: `#/${collection.slug}`,
				icon: collection.icon || groups[collection.group].icon,
			});
		}
	}

	return groups;
}
