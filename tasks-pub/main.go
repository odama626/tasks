package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"tasks-pub/routes"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/unrolled/render"
)

func main() {
	err := godotenv.Load()

	if err != nil {
		log.Fatalf("unable to load .env file")
	}

	conn, err := pgxpool.New(context.Background(), os.Getenv("PG_URL"))
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close()

	router := chi.NewRouter()
	render := render.New()

	// Add database connection to context
	router.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), "db", conn)

			next.ServeHTTP(w, r.WithContext((ctx)))
		})
	})

	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)

	routes.ConnectRoute(router)
	router.Get("/", func(w http.ResponseWriter, r *http.Request) {
		render.JSON(w, http.StatusOK, map[string]string{"hello": "world"})
	})

	http.ListenAndServe(":3000", router)
}
