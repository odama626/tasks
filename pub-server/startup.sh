#! /bin/bash

echo "migrating database"
deno task ci-migrate-db

if [ $COMPOSE_PROFILE = 'prod']; then
  echo "starting server"
  deno run --allow-read --allow-env --allow-net ./src/main.tsecho $COMPOSE_PROFILE
else if [$COMPOSE_PROFILE = 'test']; then
  echo "starting test suite"
  deno run --allow-read --allow-env --allow-net test
else 
  echo "COMPOSE_PROFILE variable not set";
  exit 1
fi


