import { getCollections, type CollectionField } from './collections';
import type { DbClient, Models } from './db';
import { upperCaseFirst } from '@zenstackhq/common-helpers';

type Fields = Record<string, CollectionField>;

export const getModel = (slug: string, db: DbClient) => {
	const collections = getCollections();
	const modelName = upperCaseFirst(slug);
	const collection = collections![modelName] || Object.values(collections!).find(c => c.slug === slug);

	if (!collection) {
		return null;
	}

	return db[collection.name as Models];
};

export const getRelationField = (field: CollectionField) => {
	return field.relation?.fields[0] || (field.type === 'relation' ? field.field : null);
}

export const getRelatedField = (field: CollectionField) => {
	if (field.type === 'relation') {
		const collections = getCollections();

		return collections[field.collection!].mainField;
	}

	return null;
}

export const buildField = (field: CollectionField, value: any, collection?: string) => {
	if (field.type === 'relation' && field.multiple) {
		return undefined;
	}

	if (field.type === 'relation') {
		const relatedField = getRelatedField(field)!;
		const collections = getCollections();

		return value({ field: collections[field.collection!].fields[relatedField] });
	} else {
		return value({ field });
	}
}

function selectField(field) {
	if (field.type === 'relation' && field.multiple) {
		return undefined;
	}

	if (field.type === 'relation') {
		const collections = getCollections();
		const relatedField = getRelatedField(field)!;

		return {
			select: {
				[relatedField]: selectField(collections[field.collection!].fields[relatedField]),
				[collections[field.collection!].idField!]: true
			}
		}
	}

	return true;
}

export const buildSelect = (fields, columns?: string[]) => {
	return (columns || Object.keys(fields)).reduce((acc, column) => {
		const field = fields[column] ? selectField(fields[column]) : true;

		if (field !== undefined) {
			acc[column] = field;

			if (fields[column]?.type === 'relation') {
				acc[fields[column].field] = true;
			}
		}

		return acc;
	}, {
		[getIdField(fields)]: true,
	});
}

export const getIdField = (fields: Fields) => {
	return Object.values(fields).find(f => f.id)?.name || 'id';
}
