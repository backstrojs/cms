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
		const collectionName = typeof field.collection === 'string' ? field.collection : '';

		return collections[collectionName].mainField;
	}

	return null;
}

export const buildField = (field: CollectionField, value: any) => {
	if ((field.relation && field.array) || (field.type === 'relation' && field.multiple)) {
		return undefined;
	}

	if (field.type === 'relation') {
		const relatedField = getRelatedField(field);
		return typeof value === 'function' ? value({ relatedField }) : { [relatedField]: value };
	} else {
		return typeof value === 'function' ? value({}) : value;
	}
}

export const buildSelect = (fields, columns?: string[]) => {
	const collections = getCollections();

	return (columns || Object.keys(fields)).reduce((acc, column) => {
		const field = buildField(fields[column], ({ relatedField }) => relatedField ? { select: {[relatedField]: true, [collections[fields[column].collection].idField]: true } } : true);

		if (field !== undefined) {
			acc[column] = field;

			if (fields[column].type === 'relation') {
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
