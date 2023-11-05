export const name = 'initialize';

export const description = `
  create initial tables
`;

export async function transaction(sql) {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
	await sql`create table users (
    id uuid primary key DEFAULT uuid_generate_v4(),
    username text unique not null,
    hash text not null,
    salt text not null,
    private_key text not null,
    public_key text not null
  );`;
}
