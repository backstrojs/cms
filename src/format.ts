import { format as dateFormat } from 'date-fns'
import { getRelatedField } from './query';

export const format = (value, column, formatStr?: string) => {
	if (column.type === 'datetime' && value) {
		return dateFormat(value, formatStr || 'yyyy-MM-dd HH:mm:ss');
	}

	if (typeof value === 'object' && column.type === 'relation') {
		const relatedField = getRelatedField(column);
		return value[column.format || relatedField] || value;
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

	return value || undefined;
}

export async function copyToClipboard(text: string) {
	try {
		await navigator.clipboard.writeText(text)
	} catch (error) {
		console.error("Failed to copy text to clipboard:", error)
	}
}
