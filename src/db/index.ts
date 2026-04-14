import { ZenStackClient } from '@zenstackhq/orm';
import { schema } from 'zenstack/generated/schema';
import { config } from '../config'

type FilterNotStartingWith<Set, Needle extends string> = Set extends `${Needle}${infer _X}` ? never : Set;

const db = new ZenStackClient(schema, {
	plugins: [],
	...config!.database,
	log(event) {
		if (event.level === 'query') {
			// console.log(event.query.sql, event.queryDurationMillis);
		} else if (event.level === 'error') {
			console.error(event);
		}
	}
})

export type DbClient = typeof db;
export type Models = FilterNotStartingWith<keyof DbClient, '$'>;

export default db;
