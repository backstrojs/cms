import { ZenStackClient } from '@zenstackhq/orm';
import { type SchemaDef } from '@zenstackhq/orm/schema';

export default (config, schema: SchemaDef) => new ZenStackClient(schema, {
	plugins: [],
	...config!.database,
	log(event) {
		if (event.level === 'query') {
			// console.log(event.query.sql, event.queryDurationMillis, event.query.parameters);
		} else if (event.level === 'error') {
			console.error(event);
		}
	}
})

export type DbClient = typeof ZenStackClient;
