import Pocketbase from 'pocketbase';
import DotEnv from 'dotenv';
import fs from 'node:fs/promises';
import JsonToTs from 'json-to-ts';

DotEnv.config();

const pb = await new Pocketbase(process.env.VITE_SERVER_URL);

const { POCKETBASE_SERVICE_USER } = process.env;
console.log({ POCKETBASE_SERVICE_USER });

await pb.admins.authWithPassword(
	process.env.POCKETBASE_SERVICE_USER,
	process.env.POCKETBASE_SERVICE_PASSWORD
);

const pageResults = await pb.collections.getFullList();

const schema = pageResults.reduce((result, next) => {
	const { id, name, type, system, schema } = next;
	result[name] = {
		id,
		name,
		type,
		system,
		schema
		// schemaLookup: Object.fromEntries(schema.map((field, i) => [field.name, i]))
	};
	return result;
}, {});

const types = JsonToTs(schema).map((type) => `export ${type}`);
types[0] = types[0].replace('RootObject', 'CollectionSchemas');
types.unshift('');

await fs.writeFile('./src/lib/db.schema.json', JSON.stringify(schema, null, 2));
console.log('Created schema at ./src/lib/db.schema.json');
await fs.writeFile('./src/lib/collections.json', JSON.stringify(pageResults, null, 2));
console.log('generated importable collections file at ./src/lib/collections.json')

await fs.writeFile('./src/lib/db.types.ts', types.join('\n\n'), { flag: 'a+' });
console.log('added types for schema to ./src/lib/db.types.ts');
