
-- each user has an asymetric key pair
-- the private key is encrypted with the raw password

-- login is accomplished by signing a login token 
-- with the private key that can be verified with
-- the public key
create table accounts (
    id uuid PRIMARY KEY default gen_random_uuid(),
    name text,
    username text unique,
    -- private key hashed by user password
    encryption_private_key_hash bytea,
    encryption_public_key jsonb,

    signing_private_key_hash bytea,
    signing_public_key jsonb,


    password_salt bytea,
    
    avatar_uri text,
    primary_color int,
    accent_color int
);

create table files (
    id uuid primary key default gen_random_uuid(),
    -- header_hash is a yjs document
    -- encrypted by a symmetric key
    -- contains:
        -- created_by
        -- updated_by
        -- created_at
        -- updated_at
        -- file_uri: file is encrypted with same key and stored on disk
        -- media_type
    header_hash bytea
);

-- each page has it's own symetric key
create table pages (
    id uuid PRIMARY KEY default gen_random_uuid(),
    parent_id uuid references pages(id),
    file_id  uuid references files(id)
);


create table account_page_key_hashes (
    account_id uuid  references accounts(id) on delete cascade,
    page_id uuid references pages(id) on delete cascade,

    -- symmetric key hashed with public key
    -- the symmetric key is unique for each page
    -- for each file
    symmetric_key_hash bytea,
    primary key(account_id, page_id)
);

create table account_outboxes (
    id uuid primary key default gen_random_uuid(),
    account_id  uuid references accounts(id) on delete cascade,
    payload_hash bytea
);


