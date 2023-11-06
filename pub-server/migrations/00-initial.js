export const name = 'initialize';

export const description = `
  create initial tables
`;

export async function transaction(sql) {
	await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
	await sql`
  create or replace function trigger_update_timestamp()
  returns trigger as $$
  begin
    new.updated = now();
    return new;
  end;
  $$ language plpgsql;`;
	console.log('created trigger');

	await sql`create table system (
    created timestamp with time zone not null default now(),
    updated timestamp with time zone not null default now()
  )`;
	await sql`create trigger set_updated_timestamp before update on system for each row execute procedure trigger_update_timestamp();`;

	await sql`create table users (
    id text primary key unique,
    username text unique not null,
    hash text not null,
    salt text not null,
    private_key text not null,
    public_key text not null,
    inherits system
  );`;
	await sql`create trigger set_updated_timestamp before update on users for each row execute procedure trigger_update_timestamp();`;

	await sql`create table inbox (
    id uuid primary key DEFAULT uuid_generate_v4(),
    type text,
    actor text,
    constraint fk_actor foreign key(actor) references users(id),
    object jsonb,
    published timestamp with time zone not null default now(),
    cc text[],
    to text[],
    inherits system
    )
  `;
	await sql`create trigger set_updated_timestamp before update on inbox for each row execute procedure trigger_update_timestamp();`;

	// await sql`create table outbox like inbox`
}
