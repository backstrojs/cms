import { format as dateFormat } from 'date-fns'
import { getRelatedField } from './query';
import { getCollections } from './collections';

export const format = (value, column, formatStr?: string) => {
	if (column.type === 'datetime' && value) {
		return dateFormat(value, formatStr || 'yyyy-MM-dd HH:mm:ss');
	}

	if (value && typeof value === 'object' && column.type === 'relation') {
		const relatedField = getRelatedField(column)!;
		const formattedValue = value[column.format || relatedField] || value;

		if (typeof formattedValue === 'object') {
			const collections = getCollections();
			const relatedCollection = collections[collections[column.collection].fields[relatedField].collection];

			if (relatedCollection) {
				return format(formattedValue[relatedCollection.mainField], relatedCollection.fields[relatedCollection.mainField]);
			}
		}

		return formattedValue;
	}

	return value;
}

export const parse = (value, column) => {
	if (column?.type === 'datetime' && value) {
		return new Date(value).toISOString();
	}
	if (column?.type === 'boolean') {
		return value === 'true' || value === true || value === 'on';
	}
	if (['number', 'int', 'float', 'decimal'].includes(column?.type || '') && value !== undefined) {
		if (value === '') return null;

		const num = Number(value);
		return isNaN(num) ? undefined : num;
	}

	return value || undefined;
}

export async function copyToClipboard(text: string) {
	try {
		await navigator.clipboard.writeText(text)
	} catch (error) {
		console.error("Failed to copy text to clipboard:", error)
	}
}
