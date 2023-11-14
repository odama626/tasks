CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- setup updated timestamp trigger
create or replace function trigger_update_timestamp()
  returns trigger as $$
  begin
    new.updated = now();
    return new;
  end;
$$ language plpgsql;


-- create base table
create table system (
  created timestamp with time zone not null default now(),
  updated timestamp with time zone not null default now()
);

create trigger set_updated_timestamp before update on system for each row execute procedure trigger_update_timestamp();

-- setup users table
create table users (
  id text primary key unique,
  username text unique not null,
  email text not null,
  password_hash text not null,
  private_key text not null,
  public_key text not null
) inherits (system);

create trigger set_updated_timestamp before update on users for each row execute procedure trigger_update_timestamp();


-- setup inbox table
create table inbox (
  id uuid primary key DEFAULT uuid_generate_v4(),
  type text,
  actor text,
  constraint fk_actor foreign key(actor) references users(id),
  object jsonb,
  published timestamp with time zone not null default now(),
  cc text[],
  "to" text[]
) inherits (system);

create trigger set_updated_timestamp before update on inbox for each row execute procedure trigger_update_timestamp();

-- setup outbox table
create table outbox (like inbox) inherits (system);
create trigger set_updated_timestamp before update on outbox for each row execute procedure trigger_update_timestamp();