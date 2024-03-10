package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/odama626/tasks/server/routes"
)

func main() {
	err := godotenv.Load()

	if err != nil {
		panic(err)
	}

	bgctx := context.Background()

	db, err := pgxpool.New(bgctx, os.Getenv("DB"))

	if err != nil {
		panic(err)
	}

	err = db.Ping(bgctx)

	if err != nil {
		panic(err)
	}

	defer db.Close()

	router := chi.NewRouter()

	router.Use(cors.Handler(cors.Options{
		// AllowedOrigins:   []string{"https://foo.com"}, // Use this to allow specific origin hosts
		AllowedOrigins: []string{"https://*", "http://*"},
		// AllowOriginFunc:  func(r *http.Request, origin string) bool { return true },
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "signature", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))

	// Add database to context
	router.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), "db", db)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	})

	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)

	routes.ConnectRoute(router)

	port := os.Getenv("PORT")
	log.Printf("Tasks service start on port %s\n", port)
	http.ListenAndServe(fmt.Sprintf(":%s", port), router)
}
