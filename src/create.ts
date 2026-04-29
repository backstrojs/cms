import { type SchemaDef } from "@zenstackhq/orm/schema";
import { Config } from "./config";
import database from "./db";
import { Collection } from "./collections";
import mailer from "./email";
import storage from "./storage";

export const createBackstro = (config: Config, collections: Record<string, Collection>, schema: SchemaDef) => {
	return {
		collections,
		config,
		db: database(config, schema),
		email: mailer(config),
		storage: storage(config)
	};
}
