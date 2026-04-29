import { definePlugin } from '@zenstackhq/orm';
import type { APIContext } from 'astro';
import * as storage from '../storage';
import { collections } from '../collections';

function getOperationHooks(collection: any, operation: string, when: 'before' | 'after') {
	if (!collection) return [];

	const hooks = collection.hooks;
	if (!hooks) return [];

	if ([ 'create', 'update' ].includes(operation)) {
		return hooks[ `${when}Change` ] || [];
	}

	if (operation === 'delete') {
		return hooks[ `${when}Delete` ] || [];
	}

	return [];
}

const withContext = (db, context: APIContext): typeof db => {
	return db.$use(definePlugin({
		id: 'backstro-plugin',
		async onQuery({ model, operation, args, proceed }: any) {
			const collection: any = (collections as any)[ model ];
			const operationName = operation.replace('ManyAndReturn', '').replace('Many', '').replace('Unique', '').replace('First', '').replace(/find|count|aggregate|exists/, 'read').toLowerCase();
			const accessControl = (collection?.access as any)?.[ operationName ] || (({ context }: { context: APIContext }) => !!context.locals.user);
			const hasAccess = await accessControl({ context });

			if (!hasAccess) {
				throw new Error('Unauthorized');
			} else if (typeof hasAccess === 'object') {
				args = hasAccess;
			}

			if ([ 'create', 'update' ].includes(operationName) && args.data && collection) {
				for (const fieldName in args.data) {
					const field = collection.fields[ fieldName ];

					if (field) {
						if (field.type === 'relation') {
							if (!field.multiple) {
								const relationFieldName = String(field.field || '');

								if (!relationFieldName) {
									continue;
								}

								args.data[ relationFieldName ] = args.data[ fieldName ], field;
							} else if (field.multiple && operationName === 'update') {
								const relationCollectionName = String(field.collection || '');
								const relationFieldName = String(field.field || '');
								const relationCollection = (collections as any)[relationCollectionName] as any;

								if (!relationCollection || !relationFieldName) {
									continue;
								}

								const idField = relationCollection.idField;
								const relatedField = (Object.values(relationCollection.fields) as any[]).find((f: any) => f.type === 'relation' && f.collection === model && f.field === relationFieldName);
								const modelClient = db[relationCollectionName];

								if (relatedField.onDelete === 'cascade') {
									await modelClient.deleteMany({
										where: {
											[ idField ]: { notIn: args.data[ fieldName ] },
											[ relationFieldName ]: args.where.id,
										}
									})
								} else if (relatedField.onDelete === 'restrict') {
									const res = await modelClient.findFirst({
										select: { [idField]: true },
										where: {
											[ idField ]: { notIn: args.data[ fieldName ] },
											[ relationFieldName ]: args.where.id,
										},
									})

									if (res) {
										throw new Error(`Cannot remove relation to ${field.collection} with id ${res[idField]} because of restrict onDelete policy`);
									}
								} else {
									await modelClient.updateMany({
										where: {
											[ idField ]: { notIn: args.data[ fieldName ] },
											[ relationFieldName ]: args.where.id,
										},
										data: {
											[ relationFieldName ]: null,
										}
									})
								}

								await modelClient.updateMany({
									where: {
										[ idField ]: { in: args.data[ fieldName ] },
									},
									data: {
										[ relationFieldName ]: args.where.id
									}
								});
							}

							delete args.data[ fieldName ];
						} else {
							args.data[ fieldName ] = args.data[ fieldName ];
						}
					}

					if (!field) {
						delete args.data[ fieldName ];
					}
				}
			}

			const beforeHooks = getOperationHooks(collection, operationName, 'before');

			for (const hook of beforeHooks) {
				args = await hook({ operation: operationName, args, context });

				if (args === false) return;
			}

			if (operationName === 'delete' && model.toLowerCase() === 'storage') {
				const item = await db.storage.findUnique({ where: { id: args.where.id } });

				if (item) {
					await storage.remove(item.driver, item.path);
				}
			}

			const result = await proceed(args);

			if (typeof result === 'object' && operationName === 'read' && collection) {
				let storageIds: string[] = [];
				for (const row of [ result ].flat()) {
					storageIds = [ ...storageIds, ...[ result ].flat().map((item: any) => (Object.values(collection.fields) as any[]).map((field: any) => {
						if (item[ field.name ] && field.type === 'storage') {
							return field.multiple ? item[ field.name ] : [ item[ field.name ] ];
						}
					})).flat().filter(Boolean) ].flat();
				}

				if (storageIds.length) {
					const storageMap = storageIds.length ? Object.fromEntries(await db.storage.findMany({
						where: {
							id: { in: storageIds },
						}
					}).then(storages => storages.map(s => [ s.id, s ]))) : {};

					for (const row of [ result ].flat() as any[]) {
						for (const field of Object.values(collection.fields) as any[]) {
							if (field.type === 'storage' && field.multiple) {
								row[ field.name ] = row[ field.name ].map((id: string) => storageMap[ id ]).filter(Boolean);
							} else if (field.type === 'storage') {
								row[ field.name ] = storageMap[ row[ field.name ] ]
							}
						}
					}
				}
			}

			const afterHooks = getOperationHooks(collection, operationName, 'after');

			for (const hook of afterHooks) {
				await hook({ operation: operationName, args, result, context });
			}

			return result;
		},
	}))
}

export default withContext;
