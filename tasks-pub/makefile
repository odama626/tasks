include .env

all: build migrate

build:
	go build

clean:
	rm -r tmp
	rm tasks-pub

reset-db: migrate-down migrate
	@echo "replayed all migrations"

migrate:
	migrate -database "${PG_URL}?sslmode=disable" -path ./pg-migrations up

migrate-down:
	migrate -database "${PG_URL}?sslmode=disable" -path ./pg-migrations down -all

db-clear:
	migrate -database "${PG_URL}?sslmode=disable" -path ./pg-migrations drop -f
	@echo "Cleared database"