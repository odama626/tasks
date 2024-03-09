include .env

build:
	go build

dev:
	air

migrate-up:
	# go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	# usage https://github.com/golang-migrate/migrate/tree/master/cmd/migrate
	migrate -database "${DB}?sslmode=disable" -path ./migrations up
migrate-down:
	migrate -database "${DB}?sslmode=disable" -path ./migrations down
